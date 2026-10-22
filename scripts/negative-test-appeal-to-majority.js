/**
 * scripts/negative-test-appeal-to-majority.js
 * [r718] appeal_to_majority 负例注入测试。
 * 逐一置空各常量验证承重；豁免注入样本必须双腿齐全，
 * 且避开其他豁免的叠加兜底（r716/r717 踩坑纪律）。
 */
'use strict';

const assert = require('assert');
const { checkAppealToMajority, __internals } = require('../src/appeal-to-majority.js');

const I = __internals();
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 基线（无注入，应命中）──────────────────────────────────────
const baselineAttacks = [
  '大家都这么认为，肯定是对的',
  '这么多人用，说明产品没问题',
  '销量第一，质量肯定最好',
  '所有人都在用这个功能，准没错',
  'Everyone believes this, so it must be true.',
  'Millions of people use it, so it cannot be wrong.',
  'The majority agrees, therefore it is correct.',
  'Most people think he is guilty, so he must be.',
];

console.log('=== r718 appeal_to_majority 负例注入测试 ===\n');

console.log('--- 基线（无注入，应全部命中）---');
for (const t of baselineAttacks) {
  test('BASE: ' + t.slice(0, 40), () => {
    const r = checkAppealToMajority(t);
    assert.strictEqual(r.hit, true, '基线应命中: ' + t);
  });
}

// ─── 注入测试（逐一置空常量，验证承重）──────────────────────────
console.log('\n--- 注入测试（置空常量后应翻转）---');

// 注入 MAJORITY_ZH → 中文攻击应不命中（腿①承重）
test('INJECT MAJORITY_ZH → 中文攻击不命中', () => {
  const R = { MAJORITY_ZH: /(?!)/ };
  const r = checkAppealToMajority('大家都这么认为，肯定是对的', R);
  assert.strictEqual(r.hit, false, '置空 MAJORITY_ZH 后中文攻击应不命中');
});

// 注入 CONCLUSION_ZH → 中文攻击应不命中（腿②承重）
test('INJECT CONCLUSION_ZH → 中文攻击不命中', () => {
  const R = { CONCLUSION_ZH: /(?!)/ };
  const r = checkAppealToMajority('大家都这么认为，肯定是对的', R);
  assert.strictEqual(r.hit, false, '置空 CONCLUSION_ZH 后中文攻击应不命中');
});

// 注入 MAJORITY_EN → 英文攻击应不命中（腿①承重）
test('INJECT MAJORITY_EN → 英文攻击不命中', () => {
  const R = { MAJORITY_EN: /(?!)/ };
  const r = checkAppealToMajority('Everyone believes this, so it must be true.', R);
  assert.strictEqual(r.hit, false, '置空 MAJORITY_EN 后英文攻击应不命中');
});

// 注入 CONCLUSION_EN → 英文攻击应不命中（腿②承重）
test('INJECT CONCLUSION_EN → 英文攻击不命中', () => {
  const R = { CONCLUSION_EN: /(?!)/ };
  const r = checkAppealToMajority('Everyone believes this, so it must be true.', R);
  assert.strictEqual(r.hit, false, '置空 CONCLUSION_EN 后英文攻击应不命中');
});

// ─── 豁免注入测试（置空豁免后应翻转）────────────────────────────
console.log('\n--- 豁免注入测试（置空豁免后应翻转）---');

// 注入 META_NOUN → 元话语样本应命中
// 样本双腿齐全（大家都×肯定是对的），避开 EVIDENCE_PRESENT 与
// THIRD_PERSON_EXEMPT 的触发词。
test('INJECT META_NOUN → 元话语样本应命中', () => {
  const R = { META_NOUN: /(?!)/ };
  const r = checkAppealToMajority('诉诸多数在生活中很常见，大家都这么认为，肯定是对的', R);
  assert.strictEqual(r.hit, true, '置空 META_NOUN 后元话语样本应命中');
});

// 注入 EVIDENCE_PRESENT → 有出处样本应命中
// 样本双腿齐全，避开 META_NOUN（无「诉诸多数」字样）与 THIRD_PERSON。
test('INJECT EVIDENCE_PRESENT → 有出处样本应命中', () => {
  const R = { EVIDENCE_PRESENT: /(?!)/ };
  const r = checkAppealToMajority('市场调研显示 70% 的用户都这么认为，肯定是对的', R);
  assert.strictEqual(r.hit, true, '置空 EVIDENCE_PRESENT 后有出处样本应命中');
});

// 注入 THIRD_PERSON_EXEMPT → 第三人称样本应命中
// 样本双腿齐全，避开 META_NOUN（无「诉诸多数」字样）与 EVIDENCE_PRESENT。
test('INJECT THIRD_PERSON_EXEMPT → 第三人称样本应命中', () => {
  const R = { THIRD_PERSON_EXEMPT: /(?!)/ };
  const r = checkAppealToMajority('逻辑学老师说，大家都这么认为，肯定是对的', R);
  assert.strictEqual(r.hit, true, '置空 THIRD_PERSON_EXEMPT 后第三人称样本应命中');
});

// ─── 未知注入键不崩溃 ────────────────────────────────────────────
console.log('\n--- 未知注入键不崩溃 ---');
test('UNKNOWN KEY → 不崩溃', () => {
  const R = { UNKNOWN_KEY: /(?!)/ };
  const r = checkAppealToMajority('大家都这么认为，肯定是对的', R);
  assert.strictEqual(r.hit, true, '未知注入键不应影响判定');
});

// ─── __internals 覆盖全部注入点 ──────────────────────────────────
console.log('\n--- __internals 覆盖全部注入点 ---');
test('INTERNALS → 覆盖全部注入点', () => {
  const keys = Object.keys(I);
  const expected = ['MAJORITY_ZH', 'MAJORITY_EN', 'CONCLUSION_ZH', 'CONCLUSION_EN',
    'META_NOUN', 'EVIDENCE_PRESENT', 'THIRD_PERSON_EXEMPT'];
  for (const k of expected) {
    assert.ok(keys.includes(k), '__internals 缺少 ' + k);
  }
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
