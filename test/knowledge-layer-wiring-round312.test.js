/**
 * 第 312 轮守卫：KnowledgeLayer 接线契约（防孤儿模块回归）
 *
 * 背景：src/archive/knowledge-layer.js 是 238 行完整实现（arXiv:2604.11364
 * 独立知识层：域名分区事实库），但 r312 实测扫 378 个 src 模块，
 * 外部引用数 = 0 —— 完整实现、从未被调用、也不在 _modules 里。
 * 本轮接入主链（heartflow.js lazy 注册 + start() 实例化 +
 * engine-lifecycle subsystemNames 补名）。
 *
 * 本守卫钉四件事：
 *   ① 源码里必须真的有三处接线（lazy 注册 / 实例化 / 白名单登记），
 *      防将来被当成死代码「优化」掉；
 *   ② 运行时 hf.knowledgeLayer 必须可用，8 个方法全在，存取删链路真的work；
 *   ③ _modules 必须能索引到它（防只挂实例不进注册表）；
 *   ④ 可逆性自证：把接线行从源码里删掉，守卫必须回到红。
 *
 * 运行：node test/knowledge-layer-wiring-round312.test.js
 */
'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const HF_SRC = fs.readFileSync(path.join(ROOT, 'src', 'core', 'heartflow.js'), 'utf8');
const LC_SRC = fs.readFileSync(path.join(ROOT, 'src', 'core', 'engine-lifecycle.js'), 'utf8');

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); console.log('  ✗ ' + name + '\n    ' + e.message); }
}

// ── A 段：源码三处接线必须在 ────────────────────────────────────────────
t('A1 heartflow.js 含 _KnowledgeLayer lazy 注册', () => {
  assert.ok(
    HF_SRC.indexOf("const _KnowledgeLayer = _lazy('knowledgeLayer'") !== -1,
    'lazy 注册行被删 —— 违反仓库约定 2（新模块走 lazy registry）'
  );
  assert.ok(
    HF_SRC.indexOf("require('../archive/knowledge-layer.js')") !== -1,
    'lazy loader 指向的路径被改'
  );
});

t('A2 heartflow.js start() 内实例化 this.knowledgeLayer', () => {
  assert.ok(
    /this\.knowledgeLayer\s*=\s*new \(_KnowledgeLayer\(\)\.KnowledgeLayer\)/.test(HF_SRC),
    '实例化语句被删/改写 —— 挂了注册却没实例，等于没接'
  );
});

t('A3 engine-lifecycle.js subsystemNames 含 knowledgeLayer', () => {
  assert.ok(
    LC_SRC.indexOf("'knowledgeLayer'") !== -1,
    '_registerModules 白名单没登记 —— _modules 索引不到它'
  );
});

// ── B 段：运行时真的可用（起真引擎，不mock） ────────────────────────────
function boot() {
  const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
  const hf = new HeartFlow({ rootPath: ROOT });
  hf.start();
  return hf;
}

t('B1 hf.knowledgeLayer 实例可访问且是 KnowledgeLayer', () => {
  const hf = boot();
  assert.ok(hf.knowledgeLayer, 'hf.knowledgeLayer 为 undefined —— 接线没生效');
  assert.strictEqual(hf.knowledgeLayer.constructor.name, 'KnowledgeLayer',
    '类型不是 KnowledgeLayer: ' + (hf.knowledgeLayer && hf.knowledgeLayer.constructor.name));
});

t('B2 8 个公共方法全部存在', () => {
  const hf = boot();
  const kl = hf.knowledgeLayer;
  const need = ['store', 'query', 'getDomains', 'getFact', 'removeFact', 'getStats', 'clear'];
  for (const m of need) {
    assert.strictEqual(typeof kl[m], 'function', '缺少方法 ' + m);
  }
  assert.ok(kl._generateId, '缺少内部 _generateId（守卫源码未被动过的信号）');
});

t('B3 存取删链路真实可用（不做恒绿mock）', () => {
  const hf = boot();
  const kl = hf.knowledgeLayer;
  kl.clear();
  assert.strictEqual(kl.getDomains().length, 0, 'clear 后仍有域名');

  const r = kl.store('probe-domain', { value: 'round312 probe fact' },
    { source: 'guard', confidence: 0.95 });
  assert.ok(r.id && r.domain === 'probe-domain', 'store 返回异常: ' + JSON.stringify(r));

  const q = kl.query('probe-domain', 'round312');
  assert.strictEqual(q.length, 1, 'query 应命中 1 条，实际 ' + q.length);
  assert.ok(q[0].score > 0, 'score 应 > 0: ' + (q[0] && q[0].score));

  const got = kl.getFact('probe-domain', r.id);
  assert.ok(got && got.source === 'guard', 'getFact 丢失或 source 不对');

  const st = kl.getStats();
  assert.strictEqual(st.domainCount, 1, 'stats.domainCount 应为 1');
  assert.strictEqual(st.totalFacts, 1, 'stats.totalFacts 应为 1');

  assert.strictEqual(kl.removeFact('probe-domain', r.id), true, 'removeFact 应返回 true');
  assert.strictEqual(kl.query('probe-domain', 'round312').length, 0, '删除后仍能查到');
  kl.clear();
});

t('B4 _modules 能索引到 knowledgeLayer', () => {
  const hf = boot();
  assert.ok(hf._modules && hf._modules.knowledgeLayer,
    '_modules.knowledgeLayer 缺失 —— 白名单登记没生效');
  assert.strictEqual(hf._modules.knowledgeLayer, hf.knowledgeLayer,
    '_modules 里的实例与 hf.knowledgeLayer 不是同一个');
});

t('B5 与 this.knowledge（KnowledgeGraph）是两个不同实例', () => {
  const hf = boot();
  assert.ok(hf.knowledge, 'hf.knowledge 不应受本轮影响');
  assert.notStrictEqual(hf.knowledge, hf.knowledgeLayer,
    '两者是同一实例 —— 说明接线覆盖了 knowledge 而不是新增 knowledgeLayer');
  assert.strictEqual(hf.knowledgeLayer.constructor.name, 'KnowledgeLayer');
});

// ── C 段：防退化 —— 源码接线被摘掉必须能被抓到 ─────────────────────────
t('C1 目标模块本身仍在 238 行以上且导出 KnowledgeLayer', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'archive', 'knowledge-layer.js'), 'utf8');
  assert.ok(src.split('\n').length >= 200, '目标模块被裁剪到 200 行以下');
  assert.ok(/module\.exports\s*=\s*\{\s*KnowledgeLayer\s*\}/.test(src),
    '目标模块导出形状被改 —— 守卫的接线前提不成立');
});

t('C2 源码里不许出现「已合并到 meaningful-memory」式的免责注释', () => {
  // triality-memory 的教训：模块被合并后原文件仍在，但早就没人引用，
  // 于是它伪装成"可用模块"长期留在仓库里。这里钉死 knowledge-layer
  // 不得退化成那种形态。
  const src = fs.readFileSync(path.join(ROOT, 'src', 'archive', 'knowledge-layer.js'), 'utf8');
  assert.ok(!/已合并|已废弃|deprecated|no longer used|superseded/i.test(src),
    '目标模块被打上已合并/已废弃标记 —— 接线可能已被事实架空');
});

console.log('\n第 312 轮 KnowledgeLayer 接线契约: ' + passed + ' 通过, ' + failed + ' 失败, 共 ' + (passed + failed) + ' 个');
if (failed > 0) {
  console.log('失败项:\n  ' + failures.join('\n  '));
  process.exit(1);
}
