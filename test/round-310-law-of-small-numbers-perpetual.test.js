/**
 * test/round-310-law-of-small-numbers-perpetual.test.js
 * r310 — law_of_small_numbers 第 239 维度「有限观测 → 永续/全称限定结论」新措辞家族（真升级②）
 *
 * 覆盖：
 *   · 攻击命中（中英 perpetual 型：小样本锚点 × 永续全称限定词，近距共现）
 *   · 良性零误伤（样本不足的正当表述 / 天文常识 / 大样本确证 / 修正句）
 *   · 负例注入：腿④ PERPETUAL_ZH/EN 整族删除 → perpetual 攻击全部不再命中（承重证明）
 *   · 负例注入：腿① SMALL_N 删除 → perpetual 攻击不再命中（腿①为 perpetual 路由共享要件）
 *   · 逐元素注入：PERPETUAL_ZH 各常量分组删除 → 专署攻击翻 miss
 *   · 路由独立性：删 UNIVERSAL_ZH/QUANT_ZH 不影响 perpetual 命中（三腿结论形态互不相同）
 *   · 引擎闸：良性样本不得以 law_of_small_numbers 进 findings
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const mod = require(path.join(ROOT, 'src/law-of-small-numbers.js'));
const { detectLawOfSmallNumbers } = mod;
const I = mod.__internals();

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击：perpetual 型（腿①小样本锚点 × 腿④永续/全称限定词）─────
const ATTACK_PERPETUAL_ZH = [
  '我观察了十次日出，太阳每次都从东边升起，所以太阳永远从东边升起。',   // 永续副词+结论重复
  '这个村有五个人活过了百岁，所以这里的空气质量能让人长寿。',           // 能让人+永续后缀
  '试了两次都很顺，所以这个方法永远有效。',                             // 永远+有效
  '抽检了3台设备都没问题，所以这批一万台设备全部合格。',                 // 抽样动词形锚点+全部合格
  '我问了身边三个朋友，他们都没遇到过问题，所以这个方案毫无风险。',       // 身边+毫无风险
  '采访了几个老客户，他们都很满意，所以这款产品包治百病。',               // 包治+百病
  '连续试了三把都赢，所以这局麻将今天手气必然一直旺。',                   // 必然+一直
];
const ATTACK_PERPETUAL_EN = [
  'A few of my friends quit smoking and lived long lives, so quitting smoking guarantees longevity.',
  'We asked a handful of customers and everyone was happy, so all users will love it.',
  'Flipped the coin three times and got heads every time, so this coin always lands heads.',
  'I tried the product twice and it worked, so it will never fail.',
];
// 逐元素注入分组：PERPETUAL_ZH 常量顺序见 src/law-of-small-numbers.js 腿④
// [0]=永续副词族(永远/永久/始终/…)  [1]=结论+永续后缀(能让人长寿/毫无风险…)  [2]=包治/根治+百病
// [3]=毫无/零+风险  [4]=全体范围裸名词  [5]=全部/整批+完成态  [6]=彻底/完全+消除
const IDX_ADVERB = 0;
const IDX_SUFFIX = 1;

const ATTACK_ADVERB = [ATTACK_PERPETUAL_ZH[0], ATTACK_PERPETUAL_ZH[2], ATTACK_PERPETUAL_ZH[6]];
const ATTACK_SUFFIX = [ATTACK_PERPETUAL_ZH[1], ATTACK_PERPETUAL_ZH[4]];

// ─── 良性（不得命中：样本不足正当表述 / 常识无关样本 / 大样本确证 / 修正句）──
const BENIGN = [
  '观察十次日出的结论只是初步假设，还需要更多数据才能下判断。',
  '抽检三台设备合格只能说明这批可能没问题，样本量远远不够，需要全检。',
  '这个村有五位百岁老人，但样本太小，不能推断是空气的作用，也可能是遗传。',
  'A few friends quit smoking and lived long lives, but that is only anecdotal evidence and cannot guarantee longevity.',
  '我问了三个朋友，样本太小，不能推广到所有用户。',
  'We asked a handful of customers; the sample is too small to conclude all users will love it.',
  '太阳从东边升起是天文常识，与样本量无关。',
  '这款药能根治糖尿病，三期临床两万人样本已证实。',
  '我们村有三个百岁老人，但三位老人都有长寿家族史，不能推断水土的作用。',
  '我试了两次很顺利，但样本太少，不能说明这个方法一定有效。',
  'I tried the product twice and it worked both times, but two trials cannot prove it never fails.',
  '问了五个同学都觉得简单，但一个班有四十人，需要全班都测过才能下结论。',
  '售后接到两三次投诉就下结论为时过早，应该先扩大回访样本。',
  'I interviewed three customers and all praised it, yet three interviews cannot speak for every user.',
];

console.log('r310 law_of_small_numbers 永续全称族测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectLawOfSmallNumbers, 'function');
  assert.equal(detectLawOfSmallNumbers('').hit, false);
  assert.equal(detectLawOfSmallNumbers(null).hit, false);
  assert.equal(detectLawOfSmallNumbers('短').hit, false);
});

check('攻击命中：中文 perpetual 型 7 条', () => {
  for (const t of ATTACK_PERPETUAL_ZH) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'law_of_small_numbers');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.evidence.some(e => e.includes('perpetual')), 'evidence 应标明 perpetual: ' + t);
    assert.ok(r.details.includes('永续'), 'details 应含永续结论描述: ' + t);
  }
});

check('攻击命中：英文 perpetual 型 4 条', () => {
  for (const t of ATTACK_PERPETUAL_EN) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：14 条（样本不足正当表述 + 常识无关样本 + 大样本确证 + 修正句）', () => {
  for (const t of BENIGN) assert.equal(detectLawOfSmallNumbers(t).hit, false, '误伤: ' + t);
});

check('负例注入：腿④ PERPETUAL_ZH 删除后中文 perpetual 攻击全部不再命中', () => {
  for (const t of ATTACK_PERPETUAL_ZH) assert.equal(detectLawOfSmallNumbers(t, { PERPETUAL_ZH: [] }).hit, false, '删PERPETUAL_ZH: ' + t.slice(0, 18));
});

check('负例注入：腿④ PERPETUAL_EN 删除后英文 perpetual 攻击全部不再命中', () => {
  for (const t of ATTACK_PERPETUAL_EN) assert.equal(detectLawOfSmallNumbers(t, { PERPETUAL_EN: [] }).hit, false, '删PERPETUAL_EN: ' + t.slice(0, 24));
});

check('负例注入：腿① SMALL_N 删除后 perpetual 攻击不再命中（腿①为 perpetual 路由共享要件）', () => {
  for (const t of ATTACK_PERPETUAL_ZH) assert.equal(detectLawOfSmallNumbers(t, { SMALL_N_ZH: [] }).hit, false, '删SMALL_N_ZH: ' + t.slice(0, 18));
  for (const t of ATTACK_PERPETUAL_EN) assert.equal(detectLawOfSmallNumbers(t, { SMALL_N_EN: [] }).hit, false, '删SMALL_N_EN: ' + t.slice(0, 24));
});

check('逐元素注入：PERPETUAL_ZH 副词族[0] 删除后永续副词攻击翻 miss，后缀型攻击仍命中', () => {
  const noAdverb = I.PERPETUAL_ZH.filter((_, i) => i !== IDX_ADVERB);
  for (const t of ATTACK_ADVERB) assert.equal(detectLawOfSmallNumbers(t, { PERPETUAL_ZH: noAdverb }).hit, false, '删副词腿: ' + t.slice(0, 18));
  for (const t of ATTACK_SUFFIX) assert.equal(detectLawOfSmallNumbers(t, { PERPETUAL_ZH: noAdverb }).hit, true, '保留后缀腿仍应命中: ' + t.slice(0, 18));
});

check('逐元素注入：PERPETUAL_ZH 后缀族[1] 删除后后缀攻击翻 miss，副词型攻击仍命中', () => {
  const noSuffix = I.PERPETUAL_ZH.filter((_, i) => i !== IDX_SUFFIX);
  for (const t of ATTACK_SUFFIX) assert.equal(detectLawOfSmallNumbers(t, { PERPETUAL_ZH: noSuffix }).hit, false, '删后缀腿: ' + t.slice(0, 18));
  for (const t of ATTACK_ADVERB) assert.equal(detectLawOfSmallNumbers(t, { PERPETUAL_ZH: noSuffix }).hit, true, '保留副词腿仍应命中: ' + t.slice(0, 18));
});

check('路由独立性：删 UNIVERSAL_ZH 不影响 perpetual 命中（perpetual 与腿①b 平行）', () => {
  for (const t of ATTACK_PERPETUAL_ZH) assert.equal(detectLawOfSmallNumbers(t, { UNIVERSAL_ZH: [] }).hit, true, '删UNIVERSAL_ZH后perpetual仍命中: ' + t.slice(0, 18));
});

check('路由独立性：删 QUANT_ZH 不影响 perpetual 命中（perpetual 与腿② 平行）', () => {
  for (const t of ATTACK_PERPETUAL_ZH) assert.equal(detectLawOfSmallNumbers(t, { QUANT_ZH: [] }).hit, true, '删QUANT_ZH后perpetual仍命中: ' + t.slice(0, 18));
});

check('路由独立性：删 PERPETUAL_ZH 不影响存量 pair 型命中（存量回归）', () => {
  const pairZh = '抛了三次硬币都是正面，这枚硬币明显是偏的';
  assert.equal(detectLawOfSmallNumbers(pairZh).hit, true, '默认命中');
  assert.equal(detectLawOfSmallNumbers(pairZh, { PERPETUAL_ZH: [] }).hit, true, '删PERPETUAL_ZH后存量pair仍命中');
});

check('路由独立性：删 PERPETUAL_ZH 不影响存量 quant 型命中（r302 回归）', () => {
  const quantZh = '抛十次硬币有七次正面，可见这枚硬币正面概率就是七成';
  assert.equal(detectLawOfSmallNumbers(quantZh, { PERPETUAL_ZH: [] }).hit, true, '删PERPETUAL_ZH后存量quant仍命中');
});

check('引擎闸：良性样本不得以 law_of_small_numbers 进 findings', () => {
  const engine = require(path.join(ROOT, 'src/gate.js'));
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('law_of_small_numbers'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
