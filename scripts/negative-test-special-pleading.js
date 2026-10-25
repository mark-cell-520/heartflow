/**
 * scripts/negative-test-special-pleading.js
 * [r719] special_pleading 负例注入测试。
 * 逐一置空各常量验证承重；豁免注入样本必须双腿齐全，
 * 且避开其他豁免的叠加兜底（r716-r718 踩坑纪律）。
 */
'use strict';

const assert = require('assert');
const { checkSpecialPleading, __internals } = require('../src/special-pleading.js');

const I = __internals();
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 基线（无注入，应命中）──────────────────────────────────────
const baselineAttacks = [
  '规则是给普通人定的，我不一样',
  '我情况特殊，所以可以例外',
  '别人迟到要扣钱，我迟到是有原因的',
  '这个规定对我不适用，我的层次不一样',
  'The rules apply to everyone else, but I am different.',
  'That policy is for regular employees; I am above that.',
  'Normal standards do not apply to someone like me.',
];

console.log('=== r719 special_pleading 负例注入测试 ===\n');

console.log('--- 基线（无注入，应全部命中）---');
for (const t of baselineAttacks) {
  test('BASE: ' + t.slice(0, 40), () => {
    const r = checkSpecialPleading(t);
    assert.strictEqual(r.hit, true, '基线应命中: ' + t);
  });
}

// ─── 注入测试（逐一置空常量，验证承重）──────────────────────────
console.log('\n--- 注入测试（置空常量后应翻转）---');

// 路由一 ZH：腿①
test('INJECT RULE_OTHERS_ZH → 路由一中文不命中', () => {
  const R = { RULE_OTHERS_ZH: /(?!)/ };
  const r = checkSpecialPleading('规则是给普通人定的，我不一样', R);
  assert.strictEqual(r.hit, false, '置空 RULE_OTHERS_ZH 后应不命中');
});
// 路由一 ZH：腿②
test('INJECT SELF_EXCEPT_ZH → 路由一中文不命中', () => {
  const R = { SELF_EXCEPT_ZH: /(?!)/ };
  const r = checkSpecialPleading('规则是给普通人定的，我不一样', R);
  assert.strictEqual(r.hit, false, '置空 SELF_EXCEPT_ZH 后应不命中');
});
// 路由二 ZH：双腿
test('INJECT OTHERS_BOUND_ZH → 路由二中文不命中', () => {
  const R = { OTHERS_BOUND_ZH: /(?!)/ };
  const r = checkSpecialPleading('别人迟到要扣钱，我迟到是有原因的', R);
  assert.strictEqual(r.hit, false, '置空 OTHERS_BOUND_ZH 后应不命中');
});
test('INJECT SELF_EXEMPT_ZH → 路由二中文不命中', () => {
  const R = { SELF_EXEMPT_ZH: /(?!)/ };
  const r = checkSpecialPleading('别人迟到要扣钱，我迟到是有原因的', R);
  assert.strictEqual(r.hit, false, '置空 SELF_EXEMPT_ZH 后应不命中');
});
// 路由三 ZH：双腿
test('INJECT SPECIAL_SELF_ZH → 路由三中文不命中', () => {
  const R = { SPECIAL_SELF_ZH: /(?!)/ };
  const r = checkSpecialPleading('我情况特殊，所以可以例外', R);
  assert.strictEqual(r.hit, false, '置空 SPECIAL_SELF_ZH 后应不命中');
});
test('INJECT EXCEPTION_GRANT_ZH → 路由三中文不命中', () => {
  const R = { EXCEPTION_GRANT_ZH: /(?!)/ };
  const r = checkSpecialPleading('我情况特殊，所以可以例外', R);
  assert.strictEqual(r.hit, false, '置空 EXCEPTION_GRANT_ZH 后应不命中');
});
// EN：腿① + 腿②
test('INJECT RULE_OTHERS_EN → 英文不命中', () => {
  const R = { RULE_OTHERS_EN: /(?!)/ };
  const r = checkSpecialPleading('The rules apply to everyone else, but I am different.', R);
  assert.strictEqual(r.hit, false, '置空 RULE_OTHERS_EN 后应不命中');
});
test('INJECT SELF_EXCEPT_EN → 英文不命中', () => {
  const R = { SELF_EXCEPT_EN: /(?!)/ };
  const r = checkSpecialPleading('The rules apply to everyone else, but I am different.', R);
  assert.strictEqual(r.hit, false, '置空 SELF_EXCEPT_EN 后应不命中');
});
test('INJECT DOUBLE_STANDARD_EN → 英文合并支不命中', () => {
  const R = { DOUBLE_STANDARD_EN: /(?!)/ };
  // 选只走合并支的样本（everyone else has to ... but I）
  const r = checkSpecialPleading('Everyone else has to clock in, but I come and go as I please.', R);
  assert.strictEqual(r.hit, false, '置空 DOUBLE_STANDARD_EN 后应不命中');
});

// ─── 豁免注入测试（置空豁免后应翻转）────────────────────────────
console.log('\n--- 豁免注入测试（置空豁免后应翻转）---');

// 注入 EVIDENCE_PRESENT → 正当程序样本应命中
// 样本双腿齐全（规则是给普通人定的×我不一样），避开 META_NOUN 与
// STRICTER_PRESENT 的触发词。
test('INJECT EVIDENCE_PRESENT → 正当程序样本应命中', () => {
  const R = { EVIDENCE_PRESENT: /(?!)/ };
  const r = checkSpecialPleading('规则是给普通人定的，但特批要走正规流程，我不一样', R);
  assert.strictEqual(r.hit, true, '置空 EVIDENCE_PRESENT 后正当程序样本应命中');
});

// 注入 META_NOUN → 元话语样本应命中
// 样本双腿齐全，避开 EVIDENCE_PRESENT 与 STRICTER_PRESENT。
test('INJECT META_NOUN → 元话语样本应命中', () => {
  const R = { META_NOUN: /(?!)/ };
  const r = checkSpecialPleading('特殊辩护在生活中很常见，规则是给普通人定的，我不一样', R);
  assert.strictEqual(r.hit, true, '置空 META_NOUN 后元话语样本应命中');
});

// 注入 STRICTER_PRESENT → 更严审查样本应命中
// 样本双腿齐全，避开 EVIDENCE_PRESENT 与 META_NOUN。
test('INJECT STRICTER_PRESENT → 更严审查样本应命中', () => {
  const R = { STRICTER_PRESENT: /(?!)/ };
  const r = checkSpecialPleading('高管有额外的审查，这是更严，规则是给普通人定的，我不一样', R);
  assert.strictEqual(r.hit, true, '置空 STRICTER_PRESENT 后更严审查样本应命中');
});

// ─── 未知注入键不崩溃 ────────────────────────────────────────────
console.log('\n--- 未知注入键不崩溃 ---');
test('UNKNOWN KEY → 不崩溃', () => {
  const R = { UNKNOWN_KEY: /(?!)/ };
  const r = checkSpecialPleading('规则是给普通人定的，我不一样', R);
  assert.strictEqual(r.hit, true, '未知注入键不应影响判定');
});

// ─── __internals 覆盖全部注入点 ──────────────────────────────────
console.log('\n--- __internals 覆盖全部注入点 ---');
test('INTERNALS → 覆盖全部注入点', () => {
  const keys = Object.keys(I);
  const expected = ['RULE_OTHERS_ZH', 'RULE_OTHERS_EN', 'SELF_EXCEPT_ZH', 'SELF_EXCEPT_EN',
    'OTHERS_BOUND_ZH', 'SELF_EXEMPT_ZH', 'SPECIAL_SELF_ZH', 'EXCEPTION_GRANT_ZH',
    'DOUBLE_STANDARD_EN', 'EVIDENCE_PRESENT', 'META_NOUN', 'STRICTER_PRESENT'];
  for (const k of expected) {
    assert.ok(keys.includes(k), '__internals 缺少 ' + k);
  }
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
