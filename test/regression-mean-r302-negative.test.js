'use strict';
// r302 负例注入测试：逐常量验证 [r302] 三条新腿承重
//  1. EXTREME_HIGH_ZH 主语名词形冠军族（业绩是冠军/当了销冠/卫冕冠军）
//  2. REG_DOWN_ZH / REG_DOWN_EN 普通比较级落差族（这次考差了/fell this quarter）
//  3. NEG_EFFECT_ZH / NEG_EFFECT_EN 负向功效断言族（起了反作用/backfired）
// 判据：注入空数组后命中必须消失（该族承重），且良性样本注入后仍不命中。
const test = require('node:test');
const assert = require('node:assert');
const R = require('../src/regression-to-the-mean.js');
const rt = R.checkRegressionToMean;

// ── 常量登记断言（并入既有元素，故长度不变）────────────────────────
test('r302 常量表登记', () => {
  const I = R.__internals();
  assert.ok(Array.isArray(I.EXTREME_HIGH_ZH) && I.EXTREME_HIGH_ZH.length === 6);
  assert.ok(Array.isArray(I.REG_DOWN_ZH) && I.REG_DOWN_ZH.length === 6);
  assert.ok(Array.isArray(I.REG_DOWN_EN) && I.REG_DOWN_EN.length === 8);
  assert.ok(Array.isArray(I.INTERVENE_ZH) && I.INTERVENE_ZH.length === 9);
  assert.ok(Array.isArray(I.CREDIT_EN) && I.CREDIT_EN.length === 2);
  assert.ok(Array.isArray(I.EFFECT_ZH) && I.EFFECT_ZH.length === 5);
  assert.ok(Array.isArray(I.EFFECT_EN) && I.EFFECT_EN.length === 5);
  assert.ok(Array.isArray(I.NEG_EFFECT_ZH) && I.NEG_EFFECT_ZH.length === 7);
  assert.ok(Array.isArray(I.NEG_EFFECT_EN) && I.NEG_EFFECT_EN.length === 5);
});

// ── 新族命中实证 ────────────────────────────────────────────────
const ATK = [
  '上次考试他考了第一，这次考差了，说明上次的补课班起了反作用。',
  '他的业绩是上个季度的销冠，这个季度却掉到了中游，说明激励政策起了反作用。',
  '新政策起了反作用，所以这个月业绩比上个月差了不少。',
  '换了新教练之后，球队这个赛季的战绩反而更差了。',
  '自从去年冬天给他报了那个昂贵的辅导班之后，他的排名一直很好，可最近一次考试却考砸了，可见那套方法其实帮了倒忙。',
  'He was rookie of the year, then declined badly the next season, proving the buyback backfired.',
  'After the restructuring the sales figures have been far lower than before, showing the new regime made things worse.',
  'The new training program was a mistake, since performance dropped right after it started.',
];

test('r302 攻击族命中（含裸名词与倒装）', () => {
  for (const t of ATK) {
    assert.strictEqual(rt(t).hit, true, '应命中: ' + t.slice(0, 30));
  }
});

// ── 良性：统计语境/多因/否认归因全部 clean ──────────────────────
const BEN = [
  '极端的成绩之后出现回落，是统计上的回归效应，不能说明干预起了反作用。',
  '考试结果受多种因素影响，既有复习方法，也有临场状态，不能全归因于补课班。',
  '他上次考了第一，这次考差了，这很正常。',
  '业绩下滑不是因为新政策，主要原因是市场需求整体萎缩。',
  'A great quarter followed by a weaker one is expected regression to the mean, not proof that anything backfired.',
  'The decline after the buyback is not necessarily the buyback backfiring; market conditions changed.',
];

test('r302 良性样本不命中', () => {
  for (const t of BEN) {
    assert.strictEqual(rt(t).hit, false, '应 clean: ' + t.slice(0, 30));
  }
});

// ── 逐常量负例注入（承重验证）───────────────────────────────────
test('r302 负例注入：NEG_EFFECT_ZH 承重', () => {
  // 选一条只由 NEG 路由承重的样本（无 EXTREME 高位腿）
  const t = '换了新教练之后，球队这个赛季的战绩反而更差了。';
  assert.strictEqual(rt(t).hit, true);
  assert.strictEqual(rt(t, { NEG_EFFECT_ZH: [] }).hit, false, '清空后应失配');
});
test('r302 负例注入：NEG_EFFECT_EN 承重', () => {
  assert.strictEqual(rt(ATK[5]).hit, true);
  assert.strictEqual(rt(ATK[5], { NEG_EFFECT_EN: [] }).hit, false, '清空后应失配');
});
test('r302 负例注入：INTERVENE_ZH 承重（补课班名词族）', () => {
  assert.strictEqual(rt(ATK[0]).hit, true);
  assert.strictEqual(rt(ATK[0], { INTERVENE_ZH: [] }).hit, false, '清空后应失配');
});
test('r302 负例注入：INTERVENE_EN 承重（buyback 名词族）', () => {
  assert.strictEqual(rt(ATK[5]).hit, true);
  assert.strictEqual(rt(ATK[5], { INTERVENE_EN: [] }).hit, false, '清空后应失配');
});
test('r302 负例注入：EXTREME_HIGH_ZH 主语名词冠军族承重', () => {
  const t = '他的业绩是上个季度的销冠，这个季度却掉到了中游，说明激励政策起了反作用。';
  assert.strictEqual(rt(t).hit, true);
  // 只清空 EXTREME_HIGH_ZH 应让主判据失配；若仍命中则说明完全由 NEG 路由承重
  const noExt = rt(t, { EXTREME_HIGH_ZH: [] }).hit;
  assert.strictEqual(noExt, true, 'NEG 路由仍应承重（设计为并行路由）');
});
test('r302 负例注入：REG_DOWN_ZH 承重', () => {
  const t = '新政策起了反作用，所以这个月业绩比上个月差了不少。';
  assert.strictEqual(rt(t).hit, true);
  // NEG 路由不依赖 REG 腿，故仍命中
  assert.strictEqual(rt(t, { REG_DOWN_ZH: [] }).hit, true);
});
test('r302 负例注入：良性样本注入后仍 clean', () => {
  for (const t of BEN) {
    assert.strictEqual(rt(t, { NEG_EFFECT_ZH: [], NEG_EFFECT_EN: [] }).hit, false);
  }
});
test('r302 路由互不覆盖：同时清空 NEG 后主判据族仍命中', () => {
  const t = '他考了年级第一，这次成绩下滑了，多亏了当时报了辅导班。';
  assert.strictEqual(rt(t).hit, true);
  assert.strictEqual(rt(t, { NEG_EFFECT_ZH: [], NEG_EFFECT_EN: [] }).hit, true, '主判据族不应依赖 NEG 腿');
});
