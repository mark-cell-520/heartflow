/**
 * test/round-302-law-of-small-numbers-quant.test.js
 * r302 — law_of_small_numbers 第 239 维度「小样本 → 数量化总体裁定」新措辞家族（真升级②）
 *
 * 覆盖：
 *   · 攻击命中（中英 quant 型：概率/比率/均值 的数值化结论，腿①小样本锚点 × 腿③数量化裁定）
 *   · 良性零误伤（大样本正当统计句——有 quant 词面但无腿①锚点，或带正当统计/样本量不足标记）
 *   · 负例注入：腿③ QUANT_ZH/EN 整族删除 → quant 攻击全部不再命中（承重证明）
 *   · 负例注入：腿① SMALL_N 删除 → quant 攻击不再命中（腿①为 quant 路由共享要件）
 *   · 逐元素注入：QUANT_ZH[0]（率+数值）/ QUANT_ZH[1]（平均+比较幅度）各自删除 → 专署攻击翻 miss
 *   · 路由独立性：删 UNIVERSAL_ZH 不影响 quant 命中；删 QUANT_ZH 不影响存量 pair 命中
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
const NEVER = /(?!)/;

// ─── 攻击：quant 型（腿①小样本锚点 × 腿③数量化裁定 近距共现）─────
const ATTACK_QUANT_ZH = [
  '抛十次硬币有七次正面，可见这枚硬币正面概率就是七成',   // 率+数值
  '我连开了三把都出货，这游戏爆率就是五成',               // 率+数值
  '问了十个人九个说好，留存率大概九十',                   // 率+裸数值
  '试了五次有四次成功，成功率八成稳了',                   // 率+数值
  '看了三个病例都没事，存活率起码九成',                   // 治愈/存活率+数值
  '我连续见了三个一米九的山东人，山东人平均身高就是比别处高一大截', // 平均+比较幅度
];
const ATTACK_QUANT_EN = [
  'Ten coin flips landed seven heads, so this coin has a 70% chance of heads.',   // number-first
  'The first five users all converted, so the conversion rate is 100%.',          // rate-first
  'I asked three colleagues and all recommended it, so the approval rate is about 90%.',
  'The first three customers all bought, so the purchase rate is 60%.',
];
// 逐元素注入分组：QUANT_ZH[0]=率+数值，QUANT_ZH[1]=平均+比较幅度
const ATTACK_RATE_ZH = ATTACK_QUANT_ZH.slice(0, 5);
const ATTACK_AVG_ZH = [ATTACK_QUANT_ZH[5]];

// ─── 良性（不得命中：大样本正当统计 / 样本量不足的正当表述）──────
const BENIGN = [
  // 大样本 + quant 词面，但无腿①锚点（数字是万/千级，SMALL_N 不收）
  '根据对三万人的调查，这款产品好评率高达92%，样本量充足结论稳健',
  '这款药的三期临床显示五年生存率达到60%，是迄今最有力的证据',
  '样本量已经扩到五万人，成功率稳定在八成，可以推广到总体',
  '我们随机抽取了三千个样本，统计显著，好评率有九成，结论可推广',
  // 有腿①但带样本量不足/正当统计标记（CORRECTIVE 豁免）
  '我问了十个人，九个推荐，但样本远远不够，不能据此推断留存率',
  '三个早期用户反馈不错，不过样本太小，还需要更多数据才能估计转化率',
  // 有腿①但无数值化裁定（只陈述，不给总体参数定数）
  '我试了三次就成功了，但这说明不了什么，可能是巧合',
  // 英文大样本（数字为千级拼写不含在 SMALL_N_EN）
  'The clinical trial enrolled 30,000 patients and the survival rate is 60%.',
  'With a sample of 50,000, the satisfaction rate sits at 90% and is statistically robust.',
];

console.log('r302 law_of_small_numbers 数量化裁定族测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectLawOfSmallNumbers, 'function');
  assert.equal(detectLawOfSmallNumbers('').hit, false);
  assert.equal(detectLawOfSmallNumbers(null).hit, false);
  assert.equal(detectLawOfSmallNumbers('短').hit, false);
});

check('攻击命中：中文 quant 型 6 条', () => {
  for (const t of ATTACK_QUANT_ZH) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'law_of_small_numbers');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.evidence.some(e => e.includes('数量化总体裁定')), 'evidence 应标明数量化裁定: ' + t);
    assert.ok(r.details.includes('数值结论'), 'details 应含数值结论描述: ' + t);
  }
});

check('攻击命中：英文 quant 型 4 条', () => {
  for (const t of ATTACK_QUANT_EN) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
    assert.ok(r.evidence.some(e => e.includes('quantitative verdict')), 'evidence: ' + t);
  }
});

check('良性零误伤：10 条（大样本正当统计 + 样本量不足 + 单腿陈述）', () => {
  for (const t of BENIGN) assert.equal(detectLawOfSmallNumbers(t).hit, false, '误伤: ' + t);
});

check('负例注入：腿③ QUANT_ZH 删除后中文 quant 攻击全部不再命中', () => {
  for (const t of ATTACK_QUANT_ZH) assert.equal(detectLawOfSmallNumbers(t, { QUANT_ZH: [] }).hit, false, '删QUANT_ZH: ' + t.slice(0, 18));
});

check('负例注入：腿③ QUANT_EN 删除后英文 quant 攻击全部不再命中', () => {
  for (const t of ATTACK_QUANT_EN) assert.equal(detectLawOfSmallNumbers(t, { QUANT_EN: [] }).hit, false, '删QUANT_EN: ' + t.slice(0, 24));
});

check('负例注入：腿① SMALL_N 删除后 quant 攻击不再命中（腿①为 quant 路由共享要件）', () => {
  for (const t of ATTACK_QUANT_ZH) assert.equal(detectLawOfSmallNumbers(t, { SMALL_N_ZH: [] }).hit, false, '删SMALL_N_ZH: ' + t.slice(0, 18));
  for (const t of ATTACK_QUANT_EN) assert.equal(detectLawOfSmallNumbers(t, { SMALL_N_EN: [] }).hit, false, '删SMALL_N_EN: ' + t.slice(0, 24));
});

check('逐元素注入：QUANT_ZH[0]（率+数值）删除后率值攻击翻 miss，均值攻击仍命中', () => {
  const onlyAvg = [I.QUANT_ZH[1]];
  for (const t of ATTACK_RATE_ZH) assert.equal(detectLawOfSmallNumbers(t, { QUANT_ZH: onlyAvg }).hit, false, '删率值腿: ' + t.slice(0, 18));
  for (const t of ATTACK_AVG_ZH) assert.equal(detectLawOfSmallNumbers(t, { QUANT_ZH: onlyAvg }).hit, true, '保留均值腿仍应命中: ' + t.slice(0, 18));
});

check('逐元素注入：QUANT_ZH[1]（平均+比较幅度）删除后均值攻击翻 miss，率值攻击仍命中', () => {
  const onlyRate = [I.QUANT_ZH[0]];
  for (const t of ATTACK_AVG_ZH) assert.equal(detectLawOfSmallNumbers(t, { QUANT_ZH: onlyRate }).hit, false, '删均值腿: ' + t.slice(0, 18));
  for (const t of ATTACK_RATE_ZH) assert.equal(detectLawOfSmallNumbers(t, { QUANT_ZH: onlyRate }).hit, true, '保留率值腿仍应命中: ' + t.slice(0, 18));
});

check('路由独立性：删 UNIVERSAL_ZH 不影响 quant 命中（quant 与腿②b 平行）', () => {
  for (const t of ATTACK_QUANT_ZH) assert.equal(detectLawOfSmallNumbers(t, { UNIVERSAL_ZH: [] }).hit, true, '删UNIVERSAL_ZH后quant仍命中: ' + t.slice(0, 18));
});

check('路由独立性：删 QUANT_ZH 不影响存量 pair 型命中（存量回归）', () => {
  const pairZh = '抛了三次硬币都是正面，这枚硬币明显是偏的';
  assert.equal(detectLawOfSmallNumbers(pairZh).hit, true, '默认命中');
  assert.equal(detectLawOfSmallNumbers(pairZh, { QUANT_ZH: [] }).hit, true, '删QUANT_ZH后存量pair仍命中');
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
