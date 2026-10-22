/**
 * scripts/negative-test-wishful-thinking.js
 * [r716] wishful_thinking 负例注入测试。
 * 逐一置空各常量验证承重；豁免注入样本必须双腿齐全，
 * 且避开其他豁免的叠加兜底。
 */
'use strict';

const assert = require('assert');
const { checkWishfulThinking, __internals } = require('../src/wishful-thinking.js');

const I = __internals();
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 基线（无注入，应命中）──────────────────────────────────────
const baselineAttacks = [
  '我相信会成功，所以一定会成功',
  '只要我足够努力，宇宙就会回应我',
  '念念不忘必有回响，想什么就来什么',
  '我这么真诚，老天不会亏待我的',
  '心诚则灵，只要信念够强就能实现',
  'I believe it will work out, so it will work out.',
  'If I want it badly enough, the universe will provide.',
  'My positive thinking alone will make it happen.',
];

console.log('=== r716 wishful_thinking 负例注入测试 ===\n');

console.log('--- 基线（无注入，应全部命中）---');
for (const t of baselineAttacks) {
  test('BASE: ' + t.slice(0, 40), () => {
    const r = checkWishfulThinking(t);
    assert.strictEqual(r.hit, true, '基线应命中: ' + t);
  });
}

// ─── 注入测试（逐一置空常量，验证承重）──────────────────────────
console.log('\n--- 注入测试（置空常量后应翻转）---');

// 注入 BELIEF_ZH → 中文攻击应不命中
test('INJECT BELIEF_ZH → 中文攻击不命中', () => {
  const R = { BELIEF_ZH: /(?!)/ };
  const r = checkWishfulThinking('我相信会成功，所以一定会成功', R);
  assert.strictEqual(r.hit, false, '置空 BELIEF_ZH 后中文攻击应不命中');
});

// 注入 BELIEF_EN → 英文攻击应不命中
test('INJECT BELIEF_EN → 英文攻击不命中', () => {
  const R = { BELIEF_EN: /(?!)/ };
  const r = checkWishfulThinking('I believe it will work out, so it will work out.', R);
  assert.strictEqual(r.hit, false, '置空 BELIEF_EN 后英文攻击应不命中');
});

// 注入 INEVITABLE_ZH → 中文路由一应不命中（但路由二超自然仍可能命中）
test('INJECT INEVITABLE_ZH → 中文路由一不命中', () => {
  const R = { INEVITABLE_ZH: /(?!)/ };
  // 选一条只有路由一（信念×必然结果）的样本，无超自然词
  const r = checkWishfulThinking('我坚信这个项目会成功，所以它一定会实现', R);
  assert.strictEqual(r.hit, false, '置空 INEVITABLE_ZH 后路由一应不命中');
});

// 注入 INEVITABLE_EN → 英文路由一应不命中
test('INJECT INEVITABLE_EN → 英文路由一不命中', () => {
  const R = { INEVITABLE_EN: /(?!)/ };
  const r = checkWishfulThinking('I am convinced this will succeed, so it is bound to.', R);
  assert.strictEqual(r.hit, false, '置空 INEVITABLE_EN 后英文路由一应不命中');
});

// 注入 SUPERNATURAL_ZH → 中文路由二应不命中
test('INJECT SUPERNATURAL_ZH → 中文路由二不命中', () => {
  const R = { SUPERNATURAL_ZH: /(?!)/ };
  // 选一条只有路由二（信念×超自然）的样本
  const r = checkWishfulThinking('我真心相信上天会眷顾努力的人，天道酬勤', R);
  assert.strictEqual(r.hit, false, '置空 SUPERNATURAL_ZH 后路由二应不命中');
});

// 注入 SUPERNATURAL_EN → 英文路由二应不命中
test('INJECT SUPERNATURAL_EN → 英文路由二不命中', () => {
  const R = { SUPERNATURAL_EN: /(?!)/ };
  const r = checkWishfulThinking('I truly believe in the law of attraction, and it will manifest.', R);
  assert.strictEqual(r.hit, false, '置空 SUPERNATURAL_EN 后英文路由二应不命中');
});

// ─── 豁免注入测试（置空豁免后应翻转）────────────────────────────
console.log('\n--- 豁免注入测试（置空豁免后应翻转）---');

// 注入 META_NOUN → 元话语样本应命中
test('INJECT META_NOUN → 元话语样本应命中', () => {
  const R = { META_NOUN: /(?!)/ };
  const r = checkWishfulThinking('一厢情愿是一种常见的认知偏差，我相信会成功所以一定会成功', R);
  assert.strictEqual(r.hit, true, '置空 META_NOUN 后元话语样本应命中');
});

// 注入 EVIDENCE_PRESENT → 证据在场样本应命中
test('INJECT EVIDENCE_PRESENT → 证据在场样本应命中', () => {
  const R = { EVIDENCE_PRESENT: /(?!)/ };
  const r = checkWishfulThinking('我相信这个方向，数据显示支持率 85%，所以一定会成功', R);
  assert.strictEqual(r.hit, true, '置空 EVIDENCE_PRESENT 后证据在场样本应命中');
});

// 注入 THIRD_PERSON_EXEMPT → 第三人称样本应命中
// 注意：样本必须避开 META_NOUN（「一厢情愿」字样），否则被 META_NOUN 兜底
// 同时 BELIEF_ZH 必须能匹配（「我相信」形式），否则缺腿不判
test('INJECT THIRD_PERSON_EXEMPT → 第三人称样本应命中', () => {
  const R = { THIRD_PERSON_EXEMPT: /(?!)/ };
  const r = checkWishfulThinking('心理咨询师说，我相信只要努力就会成功，所以一定会实现', R);
  assert.strictEqual(r.hit, true, '置空 THIRD_PERSON_EXEMPT 后第三人称样本应命中');
});

// ─── 未知注入键不崩溃 ────────────────────────────────────────────
console.log('\n--- 未知注入键不崩溃 ---');
test('UNKNOWN KEY → 不崩溃', () => {
  const R = { UNKNOWN_KEY: /(?!)/ };
  const r = checkWishfulThinking('我相信会成功，所以一定会成功', R);
  assert.strictEqual(r.hit, true, '未知注入键不应影响判定');
});

// ─── __internals 覆盖全部注入点 ──────────────────────────────────
console.log('\n--- __internals 覆盖全部注入点 ---');
test('INTERNALS → 覆盖全部注入点', () => {
  const keys = Object.keys(I);
  const expected = ['BELIEF_ZH', 'BELIEF_EN', 'INEVITABLE_ZH', 'INEVITABLE_EN',
    'SUPERNATURAL_ZH', 'SUPERNATURAL_EN', 'META_NOUN', 'EVIDENCE_PRESENT', 'THIRD_PERSON_EXEMPT'];
  for (const k of expected) {
    assert.ok(keys.includes(k), '__internals 缺少 ' + k);
  }
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
