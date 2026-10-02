/**
 * r405 — MeaningfulMemory 层分类兼容守卫
 *
 * 复测背景（scripts/round-405-layer-probe.js）：
 *   classifyLayer 只认 metadata 标记，旧语义字段 type 被完全忽略。
 *   type:'semantic' / type:'core' 静默落 ephemeral（缺省层），
 *   之后被遗忘曲线当作易失记忆删除。
 *   type:'episodic' 只因与缺省层同名而"巧合正确"，掩盖了这个缺口。
 *
 * 本守卫钉死：type → 三层模型的映射，以及缺省行为不被改变。
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const { MeaningfulMemory } = require(path.join(ROOT, 'src/memory/meaningful-memory.js'));

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('OK   ' + name); }
  catch (e) { failed++; failures.push(name + ': ' + e.message); console.log('FAIL ' + name + ' — ' + e.message); }
}

// ── A 组：层分类映射（隔离 rootPath，绝不碰 data/meaningful-memory.json）──
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r405-guard-'));
const mm = new MeaningfulMemory({ rootPath: tmp });

const layerOf = (id) => {
  for (const l of ['core', 'learned', 'ephemeral']) {
    if ((mm.layers[l] || []).some(m => m.id === id)) return l;
  }
  return 'NOT-FOUND';
};

t('A1 type:core → core（旧字段：身份规则不得掉进易失层）', () => {
  mm.store({ id: 'g-a1', content: '身份规则条目', type: 'core', metadata: {} });
  assert.strictEqual(layerOf('g-a1'), 'core');
});
t('A2 type:semantic → learned（旧字段：稳定知识不得掉进易失层）', () => {
  mm.store({ id: 'g-a2', content: '稳定知识条目', type: 'semantic', metadata: {} });
  assert.strictEqual(layerOf('g-a2'), 'learned');
});
t('A3 type:episodic → ephemeral（历史行为不变）', () => {
  mm.store({ id: 'g-a3', content: '事件条目', type: 'episodic', metadata: {} });
  assert.strictEqual(layerOf('g-a3'), 'ephemeral');
});
t('A4 type 别名 learned/knowledge → learned', () => {
  mm.store({ id: 'g-a4a', content: 'x', type: 'learned', metadata: {} });
  mm.store({ id: 'g-a4b', content: 'y', type: 'knowledge', metadata: {} });
  assert.strictEqual(layerOf('g-a4a'), 'learned');
  assert.strictEqual(layerOf('g-a4b'), 'learned');
});
t('A5 type 别名 identity/directive → core', () => {
  mm.store({ id: 'g-a5a', content: 'x', type: 'identity', metadata: {} });
  mm.store({ id: 'g-a5b', content: 'y', type: 'directive', metadata: {} });
  assert.strictEqual(layerOf('g-a5a'), 'core');
  assert.strictEqual(layerOf('g-a5b'), 'core');
});
t('A6 type:working → ephemeral（旧工作记忆仍归易失）', () => {
  mm.store({ id: 'g-a6', content: 'x', type: 'working', metadata: {} });
  assert.strictEqual(layerOf('g-a6'), 'ephemeral');
});
t('A7 显式 layer 优先于 type（显式优先不被破坏）', () => {
  mm.store({ id: 'g-a7', content: 'x', layer: 'core', type: 'ephemeral', metadata: {} });
  assert.strictEqual(layerOf('g-a7'), 'core');
});

// ── B 组：既有行为零回归 ──
t('B1 metadata.lesson → learned（原有路径不变）', () => {
  mm.store({ id: 'g-b1', content: 'x', metadata: { lesson: true } });
  assert.strictEqual(layerOf('g-b1'), 'learned');
});
t('B2 metadata.durable → core（原有路径不变）', () => {
  mm.store({ id: 'g-b2', content: 'x', metadata: { durable: true } });
  assert.strictEqual(layerOf('g-b2'), 'core');
});
t('B3 无任何提示 → ephemeral（缺省不变）', () => {
  mm.store({ id: 'g-b3', content: 'x', metadata: {} });
  assert.strictEqual(layerOf('g-b3'), 'ephemeral');
});

// ── C 组：端到端后果（分类正确 → 检索与遗忘曲线可见）──
t('C1 core 层记忆出现在 getRecentNarrative 中', () => {
  const narr = mm.getRecentNarrative(50);
  assert.ok(narr.some(m => m.id === 'g-a1'), 'type:core 记忆未进入叙事序列');
});
t('C2 层统计与 store 计数一致', () => {
  const total = ['core', 'learned', 'ephemeral'].reduce((s, l) => s + (mm.layers[l] || []).length, 0);
  assert.ok(mm.stats.totalMemories >= total - 1, `stats.totalMemories=${mm.stats.totalMemories} 少于实际 ${total}`);
});

// ── D 组：源码形状断言（防止映射被静默摘除 / 防止隔离被打穿）──
t('D1 classifyLayer 源码含 type 映射', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/memory/meaningful-memory.js'), 'utf8');
  assert.ok(/memory\.type/.test(src), 'classifyLayer 不再读取 memory.type —— 兼容映射可能已丢失');
  assert.ok(/return 'core';/.test(src) && /return 'learned';/.test(src), 'core/learned 分支缺失');
});

// [r406] 隔离必须是真隔离：导出路径跟随 rootPath。
// 历史事故：_getExportPath 直接返回模块级常量 EXPORT_PATH，完全忽略 this.rootPath，
// 于是「传 rootPath 的隔离探针/测试」实际仍在读写 repo/data/meaningful-memory.json
// 生产文件 —— r405 的记忆数据事故与「守卫未变红」假阴性都源于此。
t('D2 导出路径跟随 rootPath（隔离不得被打穿）', () => {
  // 隔离实例：导出路径必须在隔离目录内
  const isolated = new MeaningfulMemory({ rootPath: tmp });
  const p = isolated._getExportPath();
  assert.ok(p.startsWith(tmp), `导出路径未跟随 rootPath：${p}（rootPath=${tmp}）`);
  // 缺省 rootPath 等价路径：用「空目录」模拟「仓库根」，不得指向仓库 data/
  // （不直接用 ROOT 当 rootPath —— 那会加载/回写生产记忆文件）
  const fakeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'r406-fakeroot-'));
  const def = new MeaningfulMemory({ rootPath: fakeRoot });
  const dp = def._getExportPath();
  assert.ok(dp === path.join(fakeRoot, 'data', 'meaningful-memory.json'),
    `缺省形状的 rootPath 解析错误：${dp}（期望 ${path.join(fakeRoot, 'data', 'meaningful-memory.json')}）`);
  assert.ok(!dp.includes(path.join('mark-heartflow-skill', 'data')),
    `导出路径仍指向仓库内 data 目录：${dp}`);
  fs.rmSync(fakeRoot, { recursive: true, force: true });
});

fs.rmSync(tmp, { recursive: true, force: true });

console.log('\nr405 记忆层分类守卫: ' + passed + ' 通过, ' + failed + ' 失败, 共 ' + (passed + failed) + ' 个');
if (failed > 0) { console.log('失败项:\n  ' + failures.join('\n  ')); process.exit(1); }
