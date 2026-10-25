/**
 * scripts/negative-test-void-zh-standard-shift.js
 * [r717] void_zh_standard_shift 负例注入测试。
 * 逐一置空各常量验证承重；豁免注入样本必须双腿齐全，
 * 且避开其他豁免的叠加兜底（r693/r701 纪律第三次防踩）。
 */
'use strict';

const assert = require('assert');
const { checkVoidZhStandardShift, __internals } = require('../src/void-zh-standard-shift.js');

const I = __internals();
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 基线（无注入，应命中）──────────────────────────────────────
const baselineAttacks = [
  // 形态 A：指代词×事项
  '当初那件事不作数，你别拿它说事',
  // 形态 B：时间词×事项
  '我们之前的协议不作数了，一切从头讲',
  // 形态 C：裸名词×作废
  '旧标准作废，按我今天说的来',
];

console.log('=== r717 void_zh_standard_shift 负例注入测试 ===\n');

console.log('--- 基线（无注入，应全部命中）---');
for (const t of baselineAttacks) {
  test('BASE: ' + t.slice(0, 40), () => {
    const r = checkVoidZhStandardShift(t);
    assert.strictEqual(r.hit, true, '基线应命中: ' + t);
  });
}

// ─── 常量注入（逐一置空，验证承重）──────────────────────────────
console.log('\n--- 常量注入（置空后形态 A 应不命中）---');

// 注入 PAST_MATTER_DEICTIC_ZH → 形态 A 样本应不命中
test('INJECT PAST_MATTER_DEICTIC_ZH → 形态 A 不命中', () => {
  const R = { PAST_MATTER_DEICTIC_ZH: /(?!)/ };
  const r = checkVoidZhStandardShift('当初那件事不作数，你别拿它说事', R);
  assert.strictEqual(r.hit, false, '置空指代词腿后形态 A 应不命中');
});

// 注入 PAST_MATTER_TEMPORAL_ZH → 形态 B 样本应不命中
test('INJECT PAST_MATTER_TEMPORAL_ZH → 形态 B 不命中', () => {
  const R = { PAST_MATTER_TEMPORAL_ZH: /(?!)/ };
  const r = checkVoidZhStandardShift('我们之前的协议不作数了，一切从头讲', R);
  assert.strictEqual(r.hit, false, '置空时间词腿后形态 B 应不命中');
});

// 注入 PAST_MATTER_BARE_ZH → 形态 C 样本应不命中
test('INJECT PAST_MATTER_BARE_ZH → 形态 C 不命中', () => {
  const R = { PAST_MATTER_BARE_ZH: /(?!)/ };
  const r = checkVoidZhStandardShift('旧标准作废，按我今天说的来', R);
  assert.strictEqual(r.hit, false, '置空裸名词腿后形态 C 应不命中');
});

// 注入 VOID_ACT_ZH → 全部攻击应不命中（腿②是公共承重点）
test('INJECT VOID_ACT_ZH → 全部攻击不命中', () => {
  const R = { VOID_ACT_ZH: /(?!)/ };
  for (const t of baselineAttacks) {
    const r = checkVoidZhStandardShift(t, R);
    assert.strictEqual(r.hit, false, '置空作废动词腿后应不命中: ' + t);
  }
});

// ─── 豁免注入（置空豁免后应翻转）────────────────────────────────
console.log('\n--- 豁免注入（置空豁免后应翻转）---');

// 注入 META_NOUN → 元话语样本应命中
// 注意：样本必须双腿齐全（「那件事不作数」），只差 META_NOUN 兜底
test('INJECT META_NOUN → 元话语样本应命中', () => {
  const R = { META_NOUN: /(?!)/ };
  const r = checkVoidZhStandardShift('单方作废约定是一种控制话术，比如当初那件事不作数，你别拿它说事', R);
  assert.strictEqual(r.hit, true, '置空 META_NOUN 后元话语样本应命中');
});

// 注入 THIRD_PERSON_EXEMPT → 第三人称样本应命中
// 注意：样本避开 META_NOUN（不带「单方作废」字样），双腿齐全（「之前的协议不作数了」）
test('INJECT THIRD_PERSON_EXEMPT → 第三人称样本应命中', () => {
  const R = { THIRD_PERSON_EXEMPT: /(?!)/ };
  const r = checkVoidZhStandardShift('律师说，我们之前的协议不作数了，一切从头讲', R);
  assert.strictEqual(r.hit, true, '置空 THIRD_PERSON_EXEMPT 后第三人称样本应命中');
});

// 注入 PROCEDURE_EXEMPT → 流程正当性样本应命中
// 注意：样本双腿齐全（「原定条款一笔勾销」），只差 PROCEDURE_EXEMPT 兜底；
// 且避开 THIRD_PERSON_EXEMPT（不带「律师/法官」字样）
test('INJECT PROCEDURE_EXEMPT → 流程样本应命中', () => {
  const R = { PROCEDURE_EXEMPT: /(?!)/ };
  const r = checkVoidZhStandardShift('按流程走，原定条款一笔勾销，双方已签补充协议', R);
  assert.strictEqual(r.hit, true, '置空 PROCEDURE_EXEMPT 后流程样本应命中');
});

// ─── 未知注入键不崩溃 ────────────────────────────────────────────
console.log('\n--- 未知注入键不崩溃 ---');
test('UNKNOWN KEY → 不崩溃', () => {
  const R = { UNKNOWN_KEY: /(?!)/ };
  const r = checkVoidZhStandardShift('当初那件事不作数，你别拿它说事', R);
  assert.strictEqual(r.hit, true, '未知注入键不应影响判定');
});

// ─── 短文本不崩溃 ────────────────────────────────────────────────
test('SHORT TEXT → 不崩溃不命中', () => {
  const r = checkVoidZhStandardShift('作废');
  assert.strictEqual(r.hit, false, '短文本不应命中');
});

console.log(`\n=== 结果: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
