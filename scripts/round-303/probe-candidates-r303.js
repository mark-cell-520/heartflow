// probe-candidates-r303.js — r303 候选家族零命中探针（v6.8.174 gate() 全量）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const hf = require(path.join(ROOT, 'src/gate.js'));

const CANDS = {
  self_selection_bias: [
    '报名我们课程的同学收入都涨了，所以课程有效',
    '自愿参加培训的员工绩效都更好，说明培训能提升绩效',
    '选择使用新工具的团队交付速度都更快，所以新工具提高了效率',
    '用户自己勾选了高级套餐，他们的满意度就是更高，所以高级套餐更让人满意',
    'Employees who volunteered for the training performed better, so the training improves performance.',
    'Firms that opted in to our program renewed at 90%, so the program drives retention.',
    'Readers who signed up for the challenge read more books, so the challenge boosts reading.',
    'The customers who chose our premium tier are happier, so the premium tier makes customers happier.',
  ],
  survivor_time_bias: [
    '这个疗法要长期服药才有效，能坚持服药的病人本来就更重视健康，所以疗效是他们自己选出来的',
    'The patients who managed to stay on the drug for years were already more health-conscious, so the benefit is self-selected.',
  ],
  significance_effect_size: [
    'p 值小于 0.05，所以这个效应一定很大很重要',
    'p<0.001 说明效果极其显著，一定具有重大实际意义',
    'p is below 0.05, so the effect must be large and practically important.',
    'p<0.001 means the result is highly significant, so it must matter a lot in practice.',
  ],
  p_hacking: [
    '我们分析了十几个指标，终于找到一个 p=0.04 的显著结果，这说明假设成立',
    'We tested dozens of endpoints until one came out at p=0.04, which confirms the hypothesis.',
  ],
  tragedy_of_commons: [
    '这片草场 everyone 都多养一只羊没什么关系，所以每个人都该尽量多养',
    'Everyone grazing one extra sheep makes no difference, so each herder should add as many as possible.',
  ],
  winners_curse: [
    '拍卖里出价最高的人往往高估了标的真实价值，赢下来常常是亏的',
    'The highest bidder in an auction usually overestimates the true value, so winning means losing money.',
  ],
  budget_value_conflation: [
    '我们花了三个月和两百万做这个项目，所以它一定很有价值',
    'We spent three months and two million on this, so it must be very valuable.',
  ],
  average_marginal_conflation: [
    '平均每小时能生产十件，所以再加班一小时也一定能多产出十件',
    'The average output is ten units per hour, so one more hour of overtime must add ten more units.',
  ],
};

for (const [dim, arr] of Object.entries(CANDS)) {
  console.log('=== ' + dim + ' ===');
  for (const t of arr) {
    let r;
    try { r = hf.gate(t); } catch (e) { console.log(JSON.stringify({text: t.slice(0,40), err: String(e).slice(0,80)})); continue; }
    const fs = (r.findings || []).map(f => f.dimension);
    console.log(JSON.stringify({ text: t.slice(0, 34), action: r.gate && r.gate.action, findings: fs }));
  }
}
