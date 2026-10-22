/**
 * scripts/negative-test-gamblers-fallacy.js
 * [r717] gamblers_fallacy 负例注入测试。
 * 逐一置空各常量验证承重；豁免注入样本必须双腿齐全，
 * 且避开其他豁免的叠加兜底（r716 踩坑纪律）。
 */
'use strict';

const assert = require('assert');
const { checkGamblersFallacy, __internals } = require('../src/gamblers-fallacy.js');

const I = __internals();
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 基线（无注入，应命中）──────────────────────────────────────
const baselineAttacks = [
  '已经连输五把了，下一把肯定赢',
  '都出十次小了，该出大了',
  '硬币出了五次正面，下一次反面的概率大多了',
  '这老虎机今天还没吐分，下一把肯定中大奖',
  'It has been tails five times in a row, so heads is due next.',
  'After ten losses, a win is statistically more likely now.',
  'Seven reds in a row, black must be next.',
  'It has been a losing streak, so a win is statistically more likely now.',
];

console.log('=== r717 gamblers_fallacy 负例注入测试 ===\n');

console.log('--- 基线（无注入，应全部命中）---');
for (const t of baselineAttacks) {
  test('BASE: ' + t.slice(0, 40), () => {
    const r = checkGamblersFallacy(t);
    assert.strictEqual(r.hit, true, '基线应命中: ' + t);
  });
}

// ─── 注入测试（逐一置空常量，验证承重）──────────────────────────
console.log('\n--- 注入测试（置空常量后应翻转）---');

// 注入 STREAK_ZH → 中文攻击应不命中（腿①承重）
test('INJECT STREAK_ZH → 中文攻击不命中', () => {
  const R = { STREAK_ZH: /(?!)/ };
  const r = checkGamblersFallacy('已经连输五把了，下一把肯定赢', R);
  assert.strictEqual(r.hit, false, '置空 STREAK_ZH 后中文攻击应不命中');
});

// 注入 DUE_ZH → 中文攻击应不命中（腿②承重）
test('INJECT DUE_ZH → 中文攻击不命中', () => {
  const R = { DUE_ZH: /(?!)/ };
  const r = checkGamblersFallacy('已经连输五把了，下一把肯定赢', R);
  assert.strictEqual(r.hit, false, '置空 DUE_ZH 后中文攻击应不命中');
});

// 注入 STREAK_EN → 英文攻击应不命中（腿①承重）
test('INJECT STREAK_EN → 英文攻击不命中', () => {
  const R = { STREAK_EN: /(?!)/ };
  const r = checkGamblersFallacy('It has been tails five times in a row, so heads is due next.', R);
  assert.strictEqual(r.hit, false, '置空 STREAK_EN 后英文攻击应不命中');
});

// 注入 DUE_EN → 英文攻击应不命中（腿②承重）
test('INJECT DUE_EN → 英文攻击不命中', () => {
  const R = { DUE_EN: /(?!)/ };
  const r = checkGamblersFallacy('It has been tails five times in a row, so heads is due next.', R);
  assert.strictEqual(r.hit, false, '置空 DUE_EN 后英文攻击应不命中');
});

// ─── 豁免注入测试（置空豁免后应翻转）────────────────────────────
console.log('\n--- 豁免注入测试（置空豁免后应翻转）---');

// 注入 META_NOUN → 元话语样本应命中
// 样本双腿齐全（连输五把×下一把肯定赢），避开 EVIDENCE_PRESENT 与
// THIRD_PERSON_EXEMPT 的触发词。
test('INJECT META_NOUN → 元话语样本应命中', () => {
  const R = { META_NOUN: /(?!)/ };
  const r = checkGamblersFallacy('赌徒谬误在生活中很常见，已经连输五把了，下一把肯定赢', R);
  assert.strictEqual(r.hit, true, '置空 META_NOUN 后元话语样本应命中');
});

// 注入 EVIDENCE_PRESENT → 证据在场样本应命中
// 样本双腿齐全，避开 META_NOUN（无「赌徒谬误」字样）与 THIRD_PERSON。
test('INJECT EVIDENCE_PRESENT → 证据在场样本应命中', () => {
  const R = { EVIDENCE_PRESENT: /(?!)/ };
  const r = checkGamblersFallacy('每把都是独立事件，已经连输五把了，下一把肯定赢', R);
  assert.strictEqual(r.hit, true, '置空 EVIDENCE_PRESENT 后证据在场样本应命中');
});

// 注入 THIRD_PERSON_EXEMPT → 第三人称样本应命中
// 样本双腿齐全，避开 META_NOUN（无「赌徒谬误」字样）与 EVIDENCE_PRESENT。
test('INJECT THIRD_PERSON_EXEMPT → 第三人称样本应命中', () => {
  const R = { THIRD_PERSON_EXEMPT: /(?!)/ };
  const r = checkGamblersFallacy('概率论老师说，已经连输五把了，下一把肯定赢', R);
  assert.strictEqual(r.hit, true, '置空 THIRD_PERSON_EXEMPT 后第三人称样本应命中');
});

// ─── 未知注入键不崩溃 ────────────────────────────────────────────
console.log('\n--- 未知注入键不崩溃 ---');
test('UNKNOWN KEY → 不崩溃', () => {
  const R = { UNKNOWN_KEY: /(?!)/ };
  const r = checkGamblersFallacy('已经连输五把了，下一把肯定赢', R);
  assert.strictEqual(r.hit, true, '未知注入键不应影响判定');
});

// ─── __internals 覆盖全部注入点 ──────────────────────────────────
console.log('\n--- __internals 覆盖全部注入点 ---');
test('INTERNALS → 覆盖全部注入点', () => {
  const keys = Object.keys(I);
  const expected = ['STREAK_ZH', 'STREAK_EN', 'DUE_ZH', 'DUE_EN',
    'META_NOUN', 'EVIDENCE_PRESENT', 'THIRD_PERSON_EXEMPT'];
  for (const k of expected) {
    assert.ok(keys.includes(k), '__internals 缺少 ' + k);
  }
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
