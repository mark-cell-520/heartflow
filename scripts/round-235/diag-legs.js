// r235 逐腿诊断：automation_bias 漏判样本的三腿命中情况
const M = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/automation-bias.js');
const I = M.__internals ? M.__internals() : null;
console.log('internals keys:', I ? Object.keys(I).join(',') : 'NONE');

const samples = [
  'AI 模型说没问题，肯定就没问题',
  '系统会自动处理的，我们不用管',
  '算法推荐的就是最优解，直接采纳',
  'The model says no issue, so it must be fine',
  '智能系统判定通过，无需人工复核',
  '模型评分更高，所以他的方案更好',
  'automated system flagged it, no need to double-check',
];
function anyHit(list, t) { const hits = []; for (const re of list) { if (re.test(t)) hits.push(re.source.slice(0, 60)); } return hits; }
for (const t of samples) {
  const zh = (I && I.MACHINE_ZH) || [];
  console.log('\n=== ' + t);
  console.log('  MACHINE_ZH : ' + JSON.stringify(anyHit(zh, t)));
  console.log('  INFALLIBLE : ' + JSON.stringify(anyHit(I.INFALLIBLE_ZH || [], t)));
  console.log('  DEFERENCE  : ' + JSON.stringify(anyHit(I.DEFERENCE_ZH || [], t)));
  console.log('  MACHINE_EN : ' + JSON.stringify(anyHit(I.MACHINE_EN || [], t)));
  console.log('  INFALL_EN  : ' + JSON.stringify(anyHit(I.INFALLIBLE_EN || [], t)));
  console.log('  DEFER_EN   : ' + JSON.stringify(anyHit(I.DEFERENCE_EN || [], t)));
}
