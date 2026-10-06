'use strict';
// r523 支级诊断：逐条打印样本在 6 支上的命中形状，定位漏检支。
const { __internals } = require('../src/cost-externalization.js');
const I = __internals();
const NAMES = ['DISTANCE_ZH','DISTANCE_EN','DISMISS_ZH','DISMISS_EN','LIGHT_ZH','LIGHT_EN','EXEMPT_ZH','EXEMPT_EN'];

const samples = [
  '反正代价又不是你付，站着说话不腰疼。',
  '担责任的是我，你就别指手画脚了。',
  'You do not bear the cost, so it is easy for you to say that.',
  'Someone else carries the risk; you only need to approve it.',
  'Since the losses are not yours, why would you object?',
  'It is not your job to worry about the consequences.',
  'The burden falls on them, not on you, so do not worry.',
  'Your approval costs you nothing; the risk sits elsewhere.',
  'It is easy to opine when none of the fallout lands on you.',
];

for (const s of samples) {
  const on = NAMES.filter(n => I[n].test(s));
  console.log(JSON.stringify(s.slice(0, 40)) + ' -> ' + (on.join(',') || '(none)'));
}
