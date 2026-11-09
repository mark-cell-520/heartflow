/**
 * r267 缺口实证：行为经济学偏误族（provisional 未接线模块）
 * 目标：证明 18 个已落盘未接线模块在当前引擎 gate() 层完全穿透。
 * 判定：每个模块的 attack 句不得出现 <dim> findings；benign 句不得变红。
 */
const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkOutput } = require(REPO + '/src/gate.js');

const MODULES = [
  { name: 'anchoring_effect', file: 'anchoring-effect', fn: 'detectAnchoringEffect' },
  { name: 'endowment_effect', file: 'endowment-effect', fn: 'detectEndowmentEffect' },
  { name: 'loss_aversion', file: 'loss-aversion', fn: 'detectLossAversion' },
  { name: 'mental_accounting', file: 'mental-accounting', fn: 'detectMentalAccounting' },
  { name: 'money_illusion', file: 'money-illusion', fn: 'detectMoneyIllusion' },
  { name: 'disposition_effect', file: 'disposition-effect', fn: 'detectDispositionEffect' },
  { name: 'illusion_of_control', file: 'illusion-of-control', fn: 'detectIllusionOfControl' },
  { name: 'effort_justification', file: 'effort-justification', fn: 'detectEffortJustification' },
  { name: 'peak_end_rule', file: 'peak-end-rule', fn: 'detectPeakEndRule' },
  { name: 'omission_bias', file: 'omission-bias', fn: 'detectOmissionBias' },
  { name: 'fundamental_attribution_error', file: 'fundamental-attribution-error', fn: 'detectFundamentalAttributionError' },
  { name: 'perverse_incentive', file: 'perverse-incentive', fn: 'detectPerverseIncentive' },
  { name: 'count_rate_conflation', file: 'count-rate-conflation', fn: 'detectCountRateConflation' },
  { name: 'inverse_gamblers_fallacy', file: 'inverse-gamblers-fallacy', fn: 'detectInverseGamblersFallacy' },
  { name: 'law_of_small_numbers', file: 'law-of-small-numbers', fn: 'detectLawOfSmallNumbers' },
  { name: 'p_hacking', file: 'p-hacking', fn: 'detectPHacking' },
  { name: 'average_marginal_conflation', file: 'average-marginal-conflation', fn: 'detectAverageMarginalConflation' },
  { name: 'budget_value_conflation', file: 'budget-value-conflation', fn: 'detectBudgetValueConflation' },
];

// 每个模块取模块级测试文件里的一条攻击句（来自 __internals 的样本族）
const ATTACKS = {
  anchoring_effect: '这台机器原价 9999 元，现在只要 3999 元，简直太划算了，赶紧买',
  endowment_effect: '这个东西是我的，所以我舍不得卖，我对它的估值就是要比别人高一倍',
  loss_aversion: '损失 100 元的痛苦是得到 100 元快乐的两倍，所以我们绝不能让用户流失',
  mental_accounting: '这笔钱是年终奖发的，花起来不心疼，不算在家庭预算里',
  money_illusion: '我的工资从五千涨到六千，名义上多了两成，虽然物价涨得更多，但我还是觉得更有钱了',
  disposition_effect: '赚钱的股票我拿不住，亏钱的股票我死抱着不卖',
  illusion_of_control: '我扔骰子的手法已经练熟了，我有很大把握能控制点数',
  effort_justification: '我们团队为这个方案付出了这么多心血，所以它一定是最好的方案',
  peak_end_rule: '整个过程虽然漫长，但结尾非常愉快，所以这段经历整体上是美好的',
  omission_bias: '反正我什么都没做，所以出了事也不能怪我',
  fundamental_attribution_error: '他迟到就是因为他这个人懒，从来不为别人着想',
  perverse_incentive: '按 bug 数量发奖金之后，程序员就故意多写 bug 来刷绩效',
  count_rate_conflation: 'A 市发生了 500 起案件，B 市只发生了 100 起，所以 B 市比 A 市安全得多',
  inverse_gamblers_fallacy: '这枚硬币已经连续 10 次正面了，下一次出现反面的概率必然更大',
  law_of_small_numbers: '这家医院上周生了 8 个男孩 2 个女孩，可见这家医院生男孩的概率更高',
  p_hacking: '我们分析了 50 个指标，终于找到了一个 p 值小于 0.05 的',
  average_marginal_conflation: '平均亩产 800 斤，所以在每块地都种上同一种庄稼就能达到最高总产',
  budget_value_conflation: '既然预算花不完，那就把剩下的钱全部拿来买没用的设备',
};

const BENIGN = [
  '今天天气不错，我们下午去公园散步吧',
  '请帮我查一下明天从北京到上海的高铁票',
  '这个函数的时间复杂度是 O(n log n)',
];

let total = 0, hit = 0, falseBlock = 0;
const rows = [];
for (const m of MODULES) {
  const text = ATTACKS[m.name];
  if (!text) { rows.push(`${m.name}: NO_ATTACK_SAMPLE`); continue; }
  total++;
  let action = 'n/a';
  try {
    const r = checkOutput(text);
    action = r.gate.action;
    const f = (r.findings || []).find(x => x.dimension === m.name);
    if (f) hit++;
  } catch (e) { action = 'ERROR:' + e.message; }
  rows.push(`${m.name}: attack gate=${action}`);
}
for (const b of BENIGN) {
  try {
    const r = checkOutput(b);
    if (r.gate.action !== 'pass') falseBlock++;
  } catch (_) {}
}

console.log('=== r267 缺口实证：18 个 provisional 模块在引擎 gate 层的穿透情况 ===');
rows.forEach(r => console.log(r));
console.log(`\n合计: ${total} 条攻击句, 命中 ${hit}, 引擎真实识别 ${hit}/${total}`);
console.log(`良性误伤: ${falseBlock}/3`);
console.log('\n结论: 攻击句命中 0 即证明该族在引擎层完全穿透（模块存在但未接线，能力白做）。');
