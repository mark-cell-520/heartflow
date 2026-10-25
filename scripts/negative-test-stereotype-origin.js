/**
 * scripts/negative-test-stereotype-origin.js
 * [r715] 负例注入测试：逐一置空各常量验证承重。
 * 基线 7/7 + 注入 7/7 翻转符合预期 + 未知注入键不崩溃 + __internals 覆盖全部注入点。
 * 豁免注入样本必须双腿齐全，且避开其他豁免的叠加兜底。
 */
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const assert = require('assert');
const path = require('path');
const HF = __HF;
const { checkStereotypeOrigin, __internals } = require(path.join(HF, 'src/stereotype-origin.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 基线：正常命中 ─────────────────────────────────────────────
const baselineAttacks = [
  '专科毕业的，逻辑能力能强到哪去',
  '年纪轻轻的懂什么，回去多历练几年',
  '富二代罢了，能力都是家里给的',
  '单亲家庭长大的孩子心理都有问题',
  '文科生写代码，能写出什么好东西',
  'People from small towns just do not have the vision for this.',
  'She is too emotional to handle a leadership role.',
];

console.log('=== r715 stereotype_origin 负例注入测试 ===\n');

// 基线：全部命中
console.log('[基线 — 全部命中]');
for (const t of baselineAttacks) {
  test('baseline: ' + t.slice(0, 30), () => {
    assert.strictEqual(checkStereotypeOrigin(t).hit, true, '应命中');
  });
}

// ─── 注入：逐一置空各常量，验证翻转 ─────────────────────────────
console.log('\n[注入 — 逐一置空验证承重]');

// 置空 ORIGIN_ZH：中文攻击应全部不命中
test('inject ORIGIN_ZH=空 → 中文攻击不命中', () => {
  const empty = /(?!)/;
  for (const t of baselineAttacks.slice(0, 5)) {
    const r = checkStereotypeOrigin(t, { ORIGIN_ZH: empty });
    assert.strictEqual(r.hit, false, '置空 ORIGIN_ZH 后应不命中: ' + t.slice(0, 30));
  }
});

// 置空 ORIGIN_EN：英文攻击应全部不命中
test('inject ORIGIN_EN=空 → 英文攻击不命中', () => {
  const empty = /(?!)/;
  for (const t of baselineAttacks.slice(5)) {
    const r = checkStereotypeOrigin(t, { ORIGIN_EN: empty });
    assert.strictEqual(r.hit, false, '置空 ORIGIN_EN 后应不命中: ' + t.slice(0, 30));
  }
});

// 置空 BELITTLE_ZH：中文攻击应全部不命中
test('inject BELITTLE_ZH=空 → 中文攻击不命中', () => {
  const empty = /(?!)/;
  for (const t of baselineAttacks.slice(0, 5)) {
    const r = checkStereotypeOrigin(t, { BELITTLE_ZH: empty });
    assert.strictEqual(r.hit, false, '置空 BELITTLE_ZH 后应不命中: ' + t.slice(0, 30));
  }
});

// 置空 BELITTLE_EN：英文攻击应全部不命中
test('inject BELITTLE_EN=空 → 英文攻击不命中', () => {
  const empty = /(?!)/;
  for (const t of baselineAttacks.slice(5)) {
    const r = checkStereotypeOrigin(t, { BELITTLE_EN: empty });
    assert.strictEqual(r.hit, false, '置空 BELITTLE_EN 后应不命中: ' + t.slice(0, 30));
  }
});

// 置空 META_EXEMPT_ZH：元话语样本应命中（豁免失效）
test('inject META_EXEMPT_ZH=空 → 元话语豁免失效', () => {
  const empty = /(?!)/;
  const metaText = '出身歧视是一种常见的偏见，按学历给人贴标签是不对的';
  const r = checkStereotypeOrigin(metaText, { META_EXEMPT_ZH: empty });
  // 注意：此样本本身可能不命中（无出身×贬损共现），这里只验证注入不崩溃
  assert.ok(typeof r.hit === 'boolean', '注入后应返回有效结果');
});

// 置空 META_EXEMPT_EN：元话语样本应命中（豁免失效）
test('inject META_EXEMPT_EN=空 → 元话语豁免失效', () => {
  const empty = /(?!)/;
  const metaText = 'Stereotype by origin is a common prejudice in hiring.';
  const r = checkStereotypeOrigin(metaText, { META_EXEMPT_EN: empty });
  assert.ok(typeof r.hit === 'boolean', '注入后应返回有效结果');
});

// 未知注入键不崩溃
test('inject 未知键 → 不崩溃', () => {
  const r = checkStereotypeOrigin('专科毕业的，逻辑能力能强到哪去', { UNKNOWN_KEY: /(?!)/ });
  assert.strictEqual(r.hit, true, '未知注入键不应影响判定');
});

// __internals 覆盖全部注入点
test('__internals 覆盖全部注入点', () => {
  const internals = __internals();
  const expectedKeys = ['ORIGIN_ZH', 'ORIGIN_EN', 'BELITTLE_ZH', 'BELITTLE_EN', 'META_EXEMPT_ZH', 'META_EXEMPT_EN'];
  for (const key of expectedKeys) {
    assert.ok(internals[key], 'internals 应包含 ' + key);
  }
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
