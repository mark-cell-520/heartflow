#!/usr/bin/env node
/**
 * round-639-memory-kernel-dispatch.test.js
 *
 * 守卫：memoryKernel（记忆内核 / 记忆写入守门人）必须注册进 _modules，
 *       其 15 个公有方法必须对 dispatch 调用方可达。
 *
 * 背景（r639）：实例在 heartflow.js L1745 启动必读（`new MemoryKernel(this.rootPath)`），
 * 但从未进 _modules —— 实测 dispatch('memoryKernel.*') 15/15 全抛
 * 'route not allowed'（scripts/round-639-recheck.js）。
 * 即「引擎记住了什么、哪些记忆被判定违规、写入配额是否超限、继承上下文是什么」
 * 这套自省数据对外部 agent / MCP 完全不可见；隐私铁律的执行位置
 * （validate 的 R1-R5 规则）也从不可达。
 *
 * 负例（注入-删条-必须变红）：删掉注册块后 dispatch 必须重新抛
 * 'route not allowed'。守卫失效 = 测试必须红。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const HF = path.join(ROOT, 'src', 'core', 'heartflow.js');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '  → ' + e.message); }
}
function boot() {
  const { HeartFlow } = require(HF);
  const hf = new HeartFlow();
  hf.start();
  return hf;
}

console.log('# round-639 memoryKernel dispatch 守卫');

// ── 1. 接线面 ────────────────────────────────────────────────────────────
t('hf.memoryKernel 实例存在', () => {
  const hf = boot();
  assert.ok(hf.memoryKernel, '实例应为真值');
});

t("_modules 有 'memoryKernel' 键且是同一常驻实例", () => {
  const hf = boot();
  assert.ok(Object.prototype.hasOwnProperty.call(hf._modules, 'memoryKernel'),
    "_modules 缺少 'memoryKernel' 键");
  assert.strictEqual(hf._modules.memoryKernel, hf.memoryKernel,
    '_modules 里的必须是同一个常驻实例，不能是新造的临时实例');
});

t('routes() 暴露 memoryKernel.* 15 条公有路由', () => {
  const hf = boot();
  const table = hf.routes();
  assert.ok(Array.isArray(table.memoryKernel),
    "routes() 表里没有 'memoryKernel' 数组");
  const real = table.memoryKernel.filter(r => !/未注册/.test(r));
  assert.ok(real.length >= 15,
    '应至少 15 个可 dispatch 公有方法路由，实得 ' + real.length);
});

const PUB_METHODS = [
  'init', 'getInheritedContext', 'flush', 'validate', 'audit', 'getInitErrors',
  'recordUser', 'recordSelf', 'writeUserMemory', 'writeSelfMemory',
  'load', 'save', 'updateProgress', 'extractTopics', 'getState',
];
t('dispatch 15/15 公有方法不抛 route not allowed', () => {
  const hf = boot();
  const bad = [];
  for (const m of PUB_METHODS) {
    try { hf.dispatch('memoryKernel.' + m, {}); }
    catch (e) {
      if (/not allowed/.test(String(e && e.message))) bad.push(m);
    }
  }
  assert.strictEqual(bad.length, 0, '这些方法仍不可达: ' + bad.join(','));
});

// ── 2. 辨别力：确实是会算的记忆守门人（非常量） ──────────────────────────
t('validate 在正常态返回 ok且无违规', () => {
  const hf = boot();
  const v = hf.dispatch('memoryKernel.validate', {});
  assert.strictEqual(v.ok, true, '正常态应 ok');
  assert.ok(Array.isArray(v.violations), 'violations 应为数组');
});

t('audit 汇总含 rules/counts/validate（守门规则可见）', () => {
  const hf = boot();
  const a = hf.dispatch('memoryKernel.audit', {});
  for (const k of ['rules', 'counts', 'lastWriteTs', 'savedAt', 'validate']) {
    assert.ok(Object.prototype.hasOwnProperty.call(a, k), 'audit 缺少字段 ' + k);
  }
  assert.ok(a.validate && typeof a.validate.ok === 'boolean', 'audit.validate 应有 ok 布尔');
});

t('recordUser 后索引计数与写入时间戳变化（非常量）', () => {
  const hf = boot();
  const m = hf._modules.memoryKernel;
  const c0 = m.audit().counts.user;
  const ts0 = m.audit().lastWriteTs;
  const id = m.recordUser('r639 guard probe: 探针写入内容');
  const au = m.audit();
  assert.ok(/^u-/.test(String(id)), 'recordUser 应返回 id，实得 ' + id);
  assert.strictEqual(au.counts.user, c0 + 1,
    'user 计数应 +1，实得 ' + c0 + ' -> ' + au.counts.user);
  assert.ok(au.lastWriteTs >= ts0, 'lastWriteTs 应推进');
});

t('getInheritedContext 返回工作集数组', () => {
  const hf = boot();
  const ctx = hf.dispatch('memoryKernel.getInheritedContext', { mode: 'working', limit: 5 });
  assert.ok(Array.isArray(ctx), '应返回数组，实得 ' + typeof ctx);
  // 实参形状经 dispatch 归一化降级只传 {mode,limit} 首字段，
  // limit 走默认 50 —— 这是已知调用形状，用直调复验"limit 真的生效"
  const direct = hf._modules.memoryKernel.getInheritedContext('working', 5);
  assert.ok(direct.length <= 5, '直调 limit=5 应被尊重，实得 ' + direct.length);
});

t('_isNoise 过滤纯噪音（守门人确实在拒绝写入）', () => {
  const hf = boot();
  const m = hf._modules.memoryKernel;
  assert.strictEqual(m._isNoise('r639 guard probe: 探针写入内容'), false,
    '实质内容不应被当噪音');
  const before = m.getState();
  m.writeUserMemory('嗯嗯');
  const after = m.getState();
  assert.strictEqual(after.lastUserInput, before.lastUserInput,
    '纯语气噪音不应被写入 state');
});

t('dispatch 对象展平降级：{text:...} 能喂给 writeUserMemory', () => {
  const hf = boot();
  const m = hf._modules.memoryKernel;
  const before = m.getState();
  hf.dispatch('memoryKernel.writeUserMemory', { text: 'r639 guard: dispatch flatten probe' });
  const after = m.getState();
  assert.ok(after.lastUserInput && after.lastUserInput.includes('dispatch flatten'),
    'dispatch 展平路径应把内容写进 state，实得 ' + after.lastUserInput);
  assert.ok(after.lastTs !== before.lastTs, '写入时间戳应更新');
});

// ── 3. 负例：删注册块 → 必须变红 ─────────────────────────────────────────
(function negativeCase() {
  console.log('  ── 负例：删掉 _modules 注册块 ──');
  const src = fs.readFileSync(HF, 'utf8');
  const lines = src.split('\n');
  const startIdx = lines.findIndex(l => /\[r639\] memoryKernel 接线/.test(l));
  assert.ok(startIdx >= 0, '负例失败：没能在源码里定位到 r639 注册注释块（守卫对象漂移了）');
  let endIdx = -1;
  for (let i = startIdx; i < lines.length; i++) {
    if (/this\._modules\['memoryKernel'\] = this\.memoryKernel;/.test(lines[i])) { endIdx = i; break; }
  }
  assert.ok(endIdx > startIdx, '负例失败：定位到注释但没找到赋值行');
  if (/^\s*\}\s*$/.test(lines[endIdx + 1] || '')) endIdx += 1;
  const removed = lines.splice(startIdx, endIdx - startIdx + 1, '  /* r639 negative: registration block removed */');
  assert.ok(/this\._modules\['memoryKernel'\]/.test(removed.join('\n')),
    '负例失败：删除的块里不含目标赋值行');
  const stripped = lines.join('\n');

  const NEG = path.join(ROOT, 'src', 'core', '__neg639.js');
  fs.writeFileSync(NEG, stripped);
  try {
    delete require.cache[require.resolve(NEG)];
    const { HeartFlow: HFNeg } = require(NEG);
    const hf = new HFNeg();
    hf.start();
    let na = 0; const other = [];
    for (const m of PUB_METHODS) {
      try { hf.dispatch('memoryKernel.' + m, {}); }
      catch (e) { /not allowed/.test(String(e.message)) ? na++ : other.push(m + ':' + e.message.slice(0, 60)); }
    }
    assert.strictEqual(na, PUB_METHODS.length,
      '删注册块后应全部 route not allowed，实得 na=' + na);
    assert.strictEqual(other.length, 0, '出现非路由错误: ' + other.join(','));
    console.log('  PASS  [负例] 删块后 15/15 抛 route not allowed（守卫有效）');
    passed++;
  } catch (e) {
    console.log('  FAIL  [负例] ' + e.message);
    failed++;
  } finally {
    try { fs.unlinkSync(NEG); } catch (_) {}
  }
})();

// ── 4. 主链路未被本次接线破坏 ────────────────────────────────────────────
t('checkOutput 仍可跑（接线不阻断主链路）', () => {
  const { checkOutput } = require(path.join(ROOT, 'src', 'gate.js'));
  const r = checkOutput('这是一个中性的测试句子，用来确认主链路没有被本次接线破坏。');
  assert.ok(r && r.gate && typeof r.gate.action === 'string', 'checkOutput 应返回带 gate.action 的结果');
  assert.ok(['pass', 'verify', 'rewrite', 'block'].includes(r.gate.action),
    'gate.action 应合法，实得 ' + r.gate.action);
});

console.log('\n# 汇总: ' + passed + ' 过 / ' + failed + ' 败');
if (failed > 0) process.exit(1);
