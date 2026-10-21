/**
 * scripts/negative-test-cherry-picking.js
 * [r717] cherry_picking 负例注入测试。
 * 逐一置空各常量验证承重；豁免注入样本必须双腿齐全，
 * 且避开其他豁免的叠加兜底。
 */
'use strict';

const assert = require('assert');
const { checkCherryPicking, __internals } = require('../src/cherry-picking.js');

const I = __internals();
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 基线（无注入，应命中）──────────────────────────────────────
const baselineAttacks = [
  '他只挑对自己有利的数据说，反面证据一概不提',
  '只看成功的案例，失败的案例全被隐藏了',
  '这份报告只列支持结论的部分，反对数据一个没放',
  '他引用的都是支持自己的研究，反对的研究全部略过',
  '只讲赚钱的月份，亏钱的月份一个字不提',
  '数据里挑出几个好看的数字，难看的全部删掉',
  'He only cites the studies that support his view and ignores the rest.',
  'They cherry-picked the best quarters and left out the losses.',
  'She presents only the successful cases and hides the failures.',
];

console.log('=== r717 cherry_picking 负例注入测试 ===\n');

console.log('--- 基线（无注入，应全部命中）---');
for (const t of baselineAttacks) {
  test('BASE: ' + t.slice(0, 40), () => {
    const r = checkCherryPicking(t);
    assert.strictEqual(r.hit, true, '基线应命中: ' + t);
  });
}

// ─── 注入测试（逐一置空常量，验证承重）──────────────────────────
console.log('\n--- 注入测试（置空常量后应翻转）---');

// 注入 SELECTIVE_ZH → 中文攻击应不命中
test('INJECT SELECTIVE_ZH → 中文攻击不命中', () => {
  const R = { SELECTIVE_ZH: /(?!)/ };
  const r = checkCherryPicking('他只挑对自己有利的数据说，反面证据一概不提', R);
  assert.strictEqual(r.hit, false, '置空 SELECTIVE_ZH 后中文攻击应不命中');
});

// 注入 SELECTIVE_EN → 英文攻击应不命中
test('INJECT SELECTIVE_EN → 英文攻击不命中', () => {
  const R = { SELECTIVE_EN: /(?!)/ };
  const r = checkCherryPicking('He only cites the studies that support his view and ignores the rest.', R);
  assert.strictEqual(r.hit, false, '置空 SELECTIVE_EN 后英文攻击应不命中');
});

// 注入 FAVORABLE_ZH → 中文应不命中
test('INJECT FAVORABLE_ZH → 中文攻击不命中', () => {
  const R = { FAVORABLE_ZH: /(?!)/ };
  const r = checkCherryPicking('他只挑对自己有利的数据说，反面证据一概不提', R);
  assert.strictEqual(r.hit, false, '置空 FAVORABLE_ZH 后中文攻击应不命中');
});

// 注入 FAVORABLE_EN → 英文应不命中
test('INJECT FAVORABLE_EN → 英文攻击不命中', () => {
  const R = { FAVORABLE_EN: /(?!)/ };
  const r = checkCherryPicking('He only cites the studies that support his view and ignores the rest.', R);
  assert.strictEqual(r.hit, false, '置空 FAVORABLE_EN 后英文攻击应不命中');
});

// ─── 豁免注入测试（置空豁免后应翻转）────────────────────────────
console.log('\n--- 豁免注入测试（置空豁免后应翻转）---');

// 注入 META_NOUN → 元话语样本应命中
// 样本双腿齐全（只列 + 支持结论），且不含方法透明度/第三人称字样
test('INJECT META_NOUN → 元话语样本应命中', () => {
  const R = { META_NOUN: /(?!)/ };
  const r = checkCherryPicking('摘樱桃是一种常见的证据选择偏误，他这份报告只列支持结论的部分，反对数据一个没放', R);
  assert.strictEqual(r.hit, true, '置空 META_NOUN 后元话语样本应命中');
});

// 注入 METHOD_TRANSPARENT → 方法透明度样本应命中
// 样本双腿齐全（只列 + 支持结论），且不含元话语/第三人称字样
test('INJECT METHOD_TRANSPARENT → 方法透明度样本应命中', () => {
  const R = { METHOD_TRANSPARENT: /(?!)/ };
  const r = checkCherryPicking('我们按预先注册的纳入标准筛选，但他只列支持结论的部分，反对数据一个没放', R);
  assert.strictEqual(r.hit, true, '置空 METHOD_TRANSPARENT 后方法透明度样本应命中');
});

// 注入 THIRD_PERSON_EXEMPT → 第三人称样本应命中
// 样本双腿齐全（只列 + 支持结论），且不含元话语/方法透明度字样
test('INJECT THIRD_PERSON_EXEMPT → 第三人称样本应命中', () => {
  const R = { THIRD_PERSON_EXEMPT: /(?!)/ };
  const r = checkCherryPicking('统计学家说，他这份报告只列支持结论的部分，反对数据一个没放', R);
  assert.strictEqual(r.hit, true, '置空 THIRD_PERSON_EXEMPT 后第三人称样本应命中');
});

// ─── 未知注入键不崩溃 ────────────────────────────────────────────
console.log('\n--- 未知注入键不崩溃 ---');
test('UNKNOWN KEY → 不崩溃', () => {
  const R = { UNKNOWN_KEY: /(?!)/ };
  const r = checkCherryPicking('他只挑对自己有利的数据说，反面证据一概不提', R);
  assert.strictEqual(r.hit, true, '未知注入键不应影响判定');
});

// ─── __internals 覆盖全部注入点 ──────────────────────────────────
console.log('\n--- __internals 覆盖全部注入点 ---');
test('INTERNALS → 覆盖全部注入点', () => {
  const keys = Object.keys(I);
  const expected = ['SELECTIVE_ZH', 'SELECTIVE_EN', 'FAVORABLE_ZH', 'FAVORABLE_EN',
    'META_NOUN', 'METHOD_TRANSPARENT', 'THIRD_PERSON_EXEMPT'];
  for (const k of expected) {
    assert.ok(keys.includes(k), '__internals 缺少 ' + k);
  }
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
