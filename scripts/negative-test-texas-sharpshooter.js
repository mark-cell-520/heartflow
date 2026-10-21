/**
 * scripts/negative-test-texas-sharpshooter.js
 * [r718] texas_sharpshooter 负例注入测试。
 * 逐一置空各常量验证承重；豁免注入样本必须双腿齐全，
 * 且避开其他豁免的叠加兜底。
 *
 * 结构：腿②b 承重 ×（腿① 或 腿②a）。
 * 注入 POSTHOC 后，纯噪声通路样本（无事后词）仍命中——
 * 因此负例注入选样本要区分通路。
 */
'use strict';

const assert = require('assert');
const { checkTexasSharpshooter, __internals } = require('../src/texas-sharpshooter.js');

const I = __internals();
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 基线（无注入，应命中）──────────────────────────────────────
const baselineAttacks = [
  '先开枪再画靶心，怎么解释都说得通',                                    // posthoc×law
  '他先有了结论，再回头找数据凑出规律',                                  // posthoc×law
  '数据里随机出现的巧合，被他讲成了必然规律',                            // noise×law
  '先定好答案，再从一堆数据里挑出能对上的一段',                          // posthoc×law
  '事后把散落的点连起来，说这就是趋势',                                  // posthoc×noise×law
  '结果出来之后才划定范围，然后宣称预测精准',                            // posthoc×law
  'He drew the target around the bullet holes and called it accuracy.',  // posthoc×law
  'They found a pattern in random noise and presented it as a law.',     // noise×law
  'She decided the conclusion first, then picked the data that fit.',    // posthoc×law
];

console.log('=== r718 texas_sharpshooter 负例注入测试 ===\n');

console.log('--- 基线（无注入，应全部命中）---');
for (const t of baselineAttacks) {
  test('BASE: ' + t.slice(0, 40), () => {
    const r = checkTexasSharpshooter(t);
    assert.strictEqual(r.hit, true, '基线应命中: ' + t);
  });
}

// ─── 注入测试（逐一置空常量，验证承重）──────────────────────────
// 结构：腿②b 承重 ×（腿① 或 腿②a）。
// 选样本原则：置空 X 后该样本的两条通路都不成立。
console.log('\n--- 注入测试（置空常量后应翻转）---');

// 注入 POSTHOC_ZH → 纯 posthoc 通路的中文样本不命中（噪声通路样本不受影响）
test('INJECT POSTHOC_ZH → 纯 posthoc 通路中文样本不命中', () => {
  const R = { POSTHOC_ZH: /(?!)/ };
  const r = checkTexasSharpshooter('先开枪再画靶心，怎么解释都说得通', R);
  assert.strictEqual(r.hit, false, '置空 POSTHOC_ZH 后纯 posthoc 样本应不命中');
});

// 注入 POSTHOC_EN → 纯 posthoc 通路的英文样本不命中
test('INJECT POSTHOC_EN → 纯 posthoc 通路英文样本不命中', () => {
  const R = { POSTHOC_EN: /(?!)/ };
  const r = checkTexasSharpshooter('He drew the target around the bullet holes and called it accuracy.', R);
  assert.strictEqual(r.hit, false, '置空 POSTHOC_EN 后纯 posthoc 样本应不命中');
});

// 注入 NOISE_SRC_ZH → 纯噪声通路的中文样本不命中
test('INJECT NOISE_SRC_ZH → 纯噪声通路中文样本不命中', () => {
  const R = { NOISE_SRC_ZH: /(?!)/ };
  const r = checkTexasSharpshooter('数据里随机出现的巧合，被他讲成了必然规律', R);
  assert.strictEqual(r.hit, false, '置空 NOISE_SRC_ZH 后纯噪声样本应不命中');
});

// 注入 NOISE_SRC_EN → 纯噪声通路的英文样本不命中
test('INJECT NOISE_SRC_EN → 纯噪声通路英文样本不命中', () => {
  const R = { NOISE_SRC_EN: /(?!)/ };
  const r = checkTexasSharpshooter('They found a pattern in random noise and presented it as a law.', R);
  assert.strictEqual(r.hit, false, '置空 NOISE_SRC_EN 后纯噪声样本应不命中');
});

// 注入 LAW_PRESENT_ZH → 全部中文样本不命中（承重腿）
test('INJECT LAW_PRESENT_ZH → 中文样本不命中', () => {
  const R = { LAW_PRESENT_ZH: /(?!)/ };
  const r = checkTexasSharpshooter('先开枪再画靶心，怎么解释都说得通', R);
  assert.strictEqual(r.hit, false, '置空 LAW_PRESENT_ZH 后中文样本应不命中');
});

// 注入 LAW_PRESENT_EN → 全部英文样本不命中（承重腿）
test('INJECT LAW_PRESENT_EN → 英文样本不命中', () => {
  const R = { LAW_PRESENT_EN: /(?!)/ };
  const r = checkTexasSharpshooter('He drew the target around the bullet holes and called it accuracy.', R);
  assert.strictEqual(r.hit, false, '置空 LAW_PRESENT_EN 后英文样本应不命中');
});

// ─── 豁免注入测试（置空豁免后应翻转）────────────────────────────
// 样本纪律：双腿/双通路齐全（承重腿 + 至少一条伴随腿），且不含其他豁免字样。
// META 豁免样本用 posthoc×law 通路，不带「预先注册/统计学家」等字样；
// METHOD 豁免样本用 posthoc×law 通路，不带「谬误/统计学家」等字样；
// THIRD 豁免样本用 noise×law 通路（无事后词），不带「谬误/预先注册」等字样。
console.log('\n--- 豁免注入测试（置空豁免后应翻转）---');

test('INJECT META_DISCOURSE → 元话语样本应命中', () => {
  const R = { META_DISCOURSE: /(?!)/ };
  const r = checkTexasSharpshooter('先开枪再画靶心是一种常见的统计陷阱，他就这么干过：先开枪再画靶心，怎么解释都说得通', R);
  assert.strictEqual(r.hit, true, '置空 META_DISCOURSE 后元话语样本应命中');
});

test('INJECT METHOD_TRANSPARENT → 方法透明度样本应命中', () => {
  const R = { METHOD_TRANSPARENT: /(?!)/ };
  const r = checkTexasSharpshooter('他声称做了预先注册的检验，但实际上先开枪再画靶心，怎么解释都说得通', R);
  assert.strictEqual(r.hit, true, '置空 METHOD_TRANSPARENT 后方法透明度样本应命中');
});

test('INJECT THIRD_PERSON_EXEMPT → 第三人称样本应命中', () => {
  const R = { THIRD_PERSON_EXEMPT: /(?!)/ };
  const r = checkTexasSharpshooter('统计学家指出，数据里随机出现的巧合，被他讲成了必然规律', R);
  assert.strictEqual(r.hit, true, '置空 THIRD_PERSON_EXEMPT 后第三人称样本应命中');
});

// ─── 未知注入键不崩溃 ────────────────────────────────────────────
console.log('\n--- 未知注入键不崩溃 ---');
test('UNKNOWN KEY → 不崩溃', () => {
  const R = { UNKNOWN_KEY: /(?!)/ };
  const r = checkTexasSharpshooter('先开枪再画靶心，怎么解释都说得通', R);
  assert.strictEqual(r.hit, true, '未知注入键不应影响判定');
});

// ─── __internals 覆盖全部注入点 ──────────────────────────────────
console.log('\n--- __internals 覆盖全部注入点 ---');
test('INTERNALS → 覆盖全部注入点', () => {
  const keys = Object.keys(I);
  const expected = ['POSTHOC_ZH', 'POSTHOC_EN', 'NOISE_SRC_ZH', 'NOISE_SRC_EN',
    'LAW_PRESENT_ZH', 'LAW_PRESENT_EN',
    'META_DISCOURSE', 'METHOD_TRANSPARENT', 'THIRD_PERSON_EXEMPT'];
  for (const k of expected) {
    assert.ok(keys.includes(k), '__internals 缺少 ' + k);
  }
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
