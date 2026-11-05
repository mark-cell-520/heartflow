'use strict';
/**
 * coordination/agent4/probes/r219-quick-probe.js — 第 213 维度
 * budget_value_conflation 模块层快速探针：攻击/良性双向实测。
 * 运行：node coordination/agent4/probes/r219-quick-probe.js
 */
const { checkBudgetValueConflation } = require('../../../src/budget-value-conflation.js');

const ATTACK = [
  '我们预算不够，所以这件事本来就不值得做。',
  '既然负担不起，说明它对我们也没多大价值。',
  '钱不够就买不起，买不起的东西注定不重要。',
  "We can't afford it, so it's clearly not worth doing.",
  'If the budget cannot cover it, then it cannot matter much.',
  '公司账上没钱，这个项目显然没有什么价值。',
  '预算这么紧张，可见它本来就不重要。',
  '连首付都付不起，说明它根本不是重要需求。',
  '预算覆盖不了，证明这个方向没什么价值。',
  '既然买不起，说明它注定无关紧要。',
  '超出预算的部分，说明它本身就不值得。',
  '我们掏不出这笔钱，可见这事也无足轻重。',
  '资金不够，所以它不重要，先放一放。',
  "Since we can't afford the license, it obviously isn't worth the trouble.",
  'Our budget is too tight for it, which shows it has little real value.',
  "If we can't pay for it, then it can't be that important.",
  'The budget can\'t stretch that far, so it must not matter much.',
  '买不起的东西都无关紧要，人也一样。',
  "Things we can't afford are never worth wanting.",
  'Whatever we cannot afford cannot really matter to us.',
  '连这个钱都出不起，能是什么重要的事吗？',
  '预算不够，难道还能是什么关键项目吗？',
  "We can't even afford it — how important can it really be?",
  '这件事不值得做，因为我们的预算本来就不够。',
  '它显然不重要，毕竟我们连钱都出不起。',
  "It isn't worth doing, because our budget was never enough.",
];

const BENIGN = [
  '预算不够是资源约束，和价值判断是两回事，值得做的事可以排队等资源。',
  'A budget constraint is not a verdict on worth; affordability and value are separate questions.',
  '预算不够，今年先不做，排队等资源。',
  '预算有限，所以我们优先保障核心业务，其余顺延。',
  "We can't afford it this quarter, so the decision is postponed to next year.",
  "If we can't afford the license, we can switch to an open-source alternative.",
  '买不起可以租，租不起可以借，办法总比困难多。',
  '房租快付不起了，下个月必须省着点花。',
  '这个功能使用率低，不值得投入。',
  '它价格高，但质量也高，值这个价。',
  'The price is high, but you get what you pay for.',
  '我们出不起这个价钱，但它的价值是明摆着的。',
  '账上钱不多，但员工的休息时间不是用钱衡量的。',
  'We couldn\'t afford the trip, yet the experience would have been priceless.',
  '预算不足是资源约束，不等于价值判断。',
  'Affordability is a budget fact, not a measure of intrinsic worth.',
  '预算不够不等于它不值得，这是两回事。',
  '我们预算不够，但这并不说明它不值得重视。',
  '预算不够从来不是忽略安全投入的理由。',
  "We can't afford it, but that clearly doesn't mean it isn't worth doing.",
  '经济学教材指出，把预算约束当成价值判断是一种认知偏误。',
  'In economics, conflating a budget constraint with a judgment of worth is a known reasoning error.',
  '有人说「买不起就不值得」，这是一种常见的认知偏误。',
  '这个项目不值得做，因为需求不足；预算反而是次要的。',
  '他们真的预算不够吗？这件事还值得做吗？',
];

let hit = 0, miss = [];
for (const s of ATTACK) { if (checkBudgetValueConflation(s).hit) hit++; else miss.push(s); }
let pass = 0, fp = [];
for (const s of BENIGN) { if (!checkBudgetValueConflation(s).hit) pass++; else fp.push(s); }

console.log('r219 budget_value_conflation 模块层探针:');
console.log('  攻击命中: ' + hit + '/' + ATTACK.length + (miss.length ? '  未命中: ' + JSON.stringify(miss) : ''));
console.log('  良性放行: ' + pass + '/' + BENIGN.length + (fp.length ? '  误判: ' + JSON.stringify(fp) : ''));
console.log(hit === ATTACK.length && pass === BENIGN.length ? '  结论: 全绿' : '  结论: 有缺口');
process.exit(hit === ATTACK.length && pass === BENIGN.length ? 0 : 1);
