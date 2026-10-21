/**
 * scripts/negative-test-ad-hominem.js
 * [r719] ad_hominem 负例注入测试。
 * 逐一置空各常量验证承重；豁免注入样本必须双腿齐全，
 * 且避开其他豁免的叠加兜底。
 *
 * 结构：双腿共现（腿①人的属性贬损 × 腿②言论否定）。
 * 负例注入选样本原则：置空任一腿后该样本不再命中。
 * 豁免注入样本刻意避开其他豁免触发词，让被摘的豁免是唯一通路。
 */
'use strict';

const assert = require('assert');
const { checkAdHominem, __internals } = require('../src/ad-hominem.js');

const I = __internals();
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 基线（无注入，应命中）──────────────────────────────────────
const baselineAttacks = [
  '他的人品有问题，所以他的观点全部不成立',                          // person×dismiss
  '他连大学都没上过，说的话能有什么道理',                            // person×dismiss
  '她不过是个外行，她的分析根本不用看',                              // person×dismiss
  '一个离婚的人谈什么家庭教育，自己家都搞不好',                      // person×dismiss
  '他自己都迟到，还有脸要求别人准时',                                // person×dismiss
  '你这种人懂什么，闭嘴吧',                                          // person×dismiss
  'He is a terrible person, so everything he says is wrong.',         // person×dismiss
  'She never went to college, so her opinion does not matter.',       // person×dismiss
  'You are just an amateur; your analysis is worthless.',             // person×dismiss
];

console.log('=== r719 ad_hominem 负例注入测试 ===\n');

console.log('--- 基线（无注入，应全部命中）---');
for (const t of baselineAttacks) {
  test('BASE: ' + t.slice(0, 40), () => {
    const r = checkAdHominem(t);
    assert.strictEqual(r.hit, true, '基线应命中: ' + t);
  });
}

// ─── 注入测试（逐一置空常量，验证承重）──────────────────────────
console.log('\n--- 注入测试（置空常量后应翻转）---');

// 注入 PERSON_ZH → 中文攻击样本不命中（腿①承重）
test('INJECT PERSON_ZH → 中文攻击样本不命中', () => {
  const R = { PERSON_ZH: /(?!)/ };
  const r = checkAdHominem('他的人品有问题，所以他的观点全部不成立', R);
  assert.strictEqual(r.hit, false, '置空 PERSON_ZH 后应不命中');
});

// 注入 DISMISS_ZH → 中文攻击样本不命中（腿②承重）
test('INJECT DISMISS_ZH → 中文攻击样本不命中', () => {
  const R = { DISMISS_ZH: /(?!)/ };
  const r = checkAdHominem('他的人品有问题，所以他的观点全部不成立', R);
  assert.strictEqual(r.hit, false, '置空 DISMISS_ZH 后应不命中');
});

// 注入 PERSON_EN → 英文攻击样本不命中（腿①承重）
test('INJECT PERSON_EN → 英文攻击样本不命中', () => {
  const R = { PERSON_EN: /(?!)/ };
  const r = checkAdHominem('He is a terrible person, so everything he says is wrong.', R);
  assert.strictEqual(r.hit, false, '置空 PERSON_EN 后应不命中');
});

// 注入 DISMISS_EN → 英文攻击样本不命中（腿②承重）
test('INJECT DISMISS_EN → 英文攻击样本不命中', () => {
  const R = { DISMISS_EN: /(?!)/ };
  const r = checkAdHominem('He is a terrible person, so everything he says is wrong.', R);
  assert.strictEqual(r.hit, false, '置空 DISMISS_EN 后应不命中');
});

// ─── 豁免注入（置空豁免后良性样本应翻转成命中）──────────────────
// 样本刻意避开其他豁免触发词（不带心理咨询/复盘字样），
// 让被摘的豁免是唯一通路。
console.log('\n--- 豁免注入（置空豁免后良性样本应翻转）---');

// 注入 META_EXEMPT → 元话语概念分析样本翻转命中
// 样本带「人身攻击是指…」元话语（避开 META_NOUN 裸名词兜底，只让 META_EXEMPT 兜底）
test('INJECT META_EXEMPT → 元话语样本翻转命中', () => {
  const base = checkAdHominem('人身攻击是指以对方学历为由否定其观点的行为，他人品有问题，所以观点不成立');
  assert.strictEqual(base.hit, false, '基线应不命中');
  const r = checkAdHominem('人身攻击是指以对方学历为由否定其观点的行为，他人品有问题，所以观点不成立', { META_EXEMPT: /(?!)/ });
  assert.strictEqual(r.hit, true, '置空 META_EXEMPT 后元话语样本应翻转命中');
});

// 注入 ANTI_ADHOMINEM_ZH → 对事不对人批评样本翻转命中
// 样本带攻击双腿 + 「对事不对人」批评（该豁免是唯一通路）
test('INJECT ANTI_ADHOMINEM_ZH → 对事不对人样本翻转命中', () => {
  const base = checkAdHominem('他人品有问题所以观点不成立，但我们要对事不对人');
  assert.strictEqual(base.hit, false, '基线应不命中');
  const r = checkAdHominem('他人品有问题所以观点不成立，但我们要对事不对人', { ANTI_ADHOMINEM_ZH: /(?!)/ });
  assert.strictEqual(r.hit, true, '置空 ANTI_ADHOMINEM_ZH 后应翻转命中');
});

// 注入 ANTI_ADHOMINEM_EN → 英文反对人身攻击样本翻转命中
test('INJECT ANTI_ADHOMINEM_EN → 英文反对样本翻转命中', () => {
  const base = checkAdHominem('He is a terrible person so everything he says is wrong; attack the argument, not the person.');
  assert.strictEqual(base.hit, false, '基线应不命中');
  const r = checkAdHominem('He is a terrible person so everything he says is wrong; attack the argument, not the person.', { ANTI_ADHOMINEM_EN: /(?!)/ });
  assert.strictEqual(r.hit, true, '置空 ANTI_ADHOMINEM_EN 后应翻转命中');
});

// 注入 THIRD_PERSON_EXEMPT → 第三人称专业复盘样本翻转命中
// 样本只带「心理咨询师」字样，不带「人身攻击」字样（避开 META_EXEMPT 兜底）
test('INJECT THIRD_PERSON_EXEMPT → 第三人称复盘样本翻转命中', () => {
  const base = checkAdHominem('心理咨询师复盘时说，他人品有问题所以观点不成立，这是常见的话术');
  assert.strictEqual(base.hit, false, '基线应不命中');
  const r = checkAdHominem('心理咨询师复盘时说，他人品有问题所以观点不成立，这是常见的话术', { THIRD_PERSON_EXEMPT: /(?!)/ });
  assert.strictEqual(r.hit, true, '置空 THIRD_PERSON_EXEMPT 后应翻转命中');
});

// ─── 未知注入键不崩溃 ───────────────────────────────────────────
console.log('\n--- 稳健性 ---');
test('UNKNOWN-KEY: 未知注入键不崩溃', () => {
  const r = checkAdHominem('他的人品有问题，所以他的观点全部不成立', { NOT_A_CONST: /(?!)/ });
  assert.strictEqual(r.hit, true, '未知注入键应不影响判定');
});

// ─── __internals 覆盖全部注入点 ─────────────────────────────────
test('INTERNALS: __internals 覆盖全部 9 个注入点', () => {
  const expected = ['PERSON_ZH', 'PERSON_EN', 'DISMISS_ZH', 'DISMISS_EN',
    'META_EXEMPT', 'META_NOUN', 'ANTI_ADHOMINEM_ZH', 'ANTI_ADHOMINEM_EN', 'THIRD_PERSON_EXEMPT'];
  for (const k of expected) {
    assert.ok(I[k] instanceof RegExp, '缺少常量: ' + k);
  }
  assert.strictEqual(Object.keys(I).length, expected.length, '常量数应为 ' + expected.length + '，实际 ' + Object.keys(I).length);
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
