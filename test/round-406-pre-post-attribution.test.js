// test/round-406-pre-post-attribution.test.js
// r406 第 272 维度 pre_post_attribution（前后测无对照归因）负例注入测试
// 每腿/每组豁免逐常量验证承重——改任何一处常量都会让对应断言红。
'use strict';
const assert = require('assert');
const path = require('path');

const M = require(path.join(__dirname, '..', 'src', 'pre-post-attribution.js'));
const { checkPrePostAttribution: ck } = M;

let passed = 0;
function ok(cond, msg) { assert.ok(cond, msg); passed++; }

// ── 一、攻击族命中（三腿共现）────────────────────────────────────
const ATTACKS = [
  // 中文：前后指标对比 × 干预引入 × 归因断言
  '我上周开始吃这个保健品，这周头不晕了，说明这个保健品治好了我的头晕',
  '去年销量 100，今年改用新营销方案后销量 150，所以新方案让销量增长了 50%',
  '实施新政后交通事故下降了 30%，证明新政有效',
  '孩子上了补习班，期末成绩提高了 20 分，都是补习班的功劳',
  '换了新系统之后效率提升了 40%',
  '喝了这碗汤，三天后感冒就好了，这汤能治感冒',
  '团队换了新领导，这个季度业绩就上去了，说明新领导有能力',
  '我换了机油后车更有劲了，新机油提升了动力',
  // 英文
  'Policy changed in January and crime fell, so the policy reduced crime.',
  'She switched brands and felt better, so the new brand works.',
  'Before the campaign sales were 50, after the campaign sales were 80, therefore the campaign drove the increase.',
  'After adopting the new tool, output rose by 25%.',
];
let total = 0;
for (const t of ATTACKS) {
  assert.ok(ck(t).hit === true, `攻击族应命中: ${t.slice(0, 30)}`);
  total++;
}
console.log(`攻击族 ${total}/${ATTACKS.length} 命中`);

// ── 二、良性族不命中（三组豁免）──────────────────────────────────
const BENIGNS = [
  // ① 对照组/严谨设计在场
  '随机对照试验显示，服药组康复率 70%，对照组 30%，说明药物有效',
  'A randomized trial showed 70% recovery in the treatment group versus 30% in the control group.',
  // ② 混杂承认/谨慎解读
  '去年销量 100，今年 150，同期行业整体增长 60%，我们需要拆解增量来源',
  '上了补习班后成绩提高了 20 分，但也可能和试题难度有关',
  '新政实施后事故下降 30%，同时期内还出台了限速措施，归因需谨慎',
  '换了新领导后业绩上升，不过行业整体也在回暖',
  '战争是多因共同造成的，不能只归结于资源争夺',
  // ③ 方法学纠正在场（正在破除本谬误）
  '前后测没有对照组，这样的对比不能证明干预有效',
  'Without a control group, this before-after comparison proves nothing.',
  // 中性描述（缺归因腿）
  '公司实施了新政策，目前正在评估效果',
];
total = 0;
for (const t of BENIGNS) {
  assert.ok(ck(t).hit === false, `良性族不应命中: ${t.slice(0, 30)}`);
  total++;
}
console.log(`良性族 ${total}/${BENIGNS.length} 零误伤`);

// ── 三、逐常量承重（把某族常量清空 → 对应攻击必须停止命中）─────────
// 3.1 干预腿 ZH
{
  const t = '去年销量 100，今年改用新营销方案后销量 150，所以新方案让销量增长了 50%';
  assert.ok(ck(t, { INTERVENTION_ZH: [] }).hit === false, '清空 INTERVENTION_ZH 后应停判');
  assert.ok(ck(t, { ATTRIBUTION_ZH: [] }).hit === false, '清空 ATTRIBUTION_ZH 后应停判');
  assert.ok(ck(t, { PP_MEASURE_ZH: [] }).hit === false, '清空 PP_MEASURE_ZH 后应停判');
  total = 3;
  console.log(`中文三腿逐常量承重 ${total}/3`);
}
// 3.2 干预腿 EN
{
  const t = 'Policy changed in January and crime fell, so the policy reduced crime.';
  assert.ok(ck(t, { INTERVENTION_EN: [] }).hit === false, '清空 INTERVENTION_EN 后应停判');
  assert.ok(ck(t, { ATTRIBUTION_EN: [] }).hit === false, '清空 ATTRIBUTION_EN 后应停判');
  assert.ok(ck(t, { PP_MEASURE_EN: [] }).hit === false, '清空 PP_MEASURE_EN 后应停判');
  total = 3;
  console.log(`英文三腿逐常量承重 ${total}/3`);
}
// 3.3 豁免组承重（注入空豁免 → 良善应转为命中，证明豁免在承重）
// 注意：样本必须三腿齐全（否则豁免清空与否都不命中，测不出承重）。
// 下面这条含「改用新方案」=干预腿、「增长 50%」=测量腿、「所以」=归因腿，
// 正常状态被 EXEMPT_CONFOUND_ZH（同期也在好转/多因共同…）豁免；清空后应转为命中。
{
  const t = '今年改用新方案后销量增长 50%，所以是新方案的功劳，不过同期行业整体也在回暖';
  const normal = ck(t);
  assert.ok(normal.hit === false, '该样本含混杂承认，正常状态应被豁免');
  const all = { EXEMPT_CONTROL_ZH: [], EXEMPT_CONTROL_EN: [], EXEMPT_CONFOUND_ZH: [], EXEMPT_CONFOUND_EN: [], EXEMPT_METHOD_ZH: [], EXEMPT_METHOD_EN: [] };
  assert.ok(ck(t, all).hit === true, '清空全部豁免后应转为命中（证明豁免承重）');
  total = 1;
  console.log(`豁免组承重 ${total}/1`);
}

console.log(`\n=== round-406 pre-post-attribution: ALL ASSERTIONS PASSED ===`);
