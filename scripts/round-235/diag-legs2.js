// r235 逐腿诊断（族 C 插入后复查）
const M = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/automation-bias.js');
const I = M.__internals();
const samples = [
  'AI 模型说没问题，肯定就没问题',
  '系统会自动处理的，我们不用管',
  '算法推荐的就是最优解，直接采纳',
  '智能系统判定通过，无需人工复核',
  '模型评分更高，所以他的方案更好',
  'automated system flagged it, no need to double-check',
];
function hits(list, t) { const out = []; for (const re of list) { if (re.test(t)) out.push(re.source.slice(0, 70)); } return out; }
for (const t of samples) {
  console.log('\n=== ' + t);
  console.log('  M_ZH : ' + JSON.stringify(hits(I.MACHINE_ZH, t)));
  console.log('  I_ZH : ' + JSON.stringify(hits(I.INFALLIBLE_ZH, t)));
  console.log('  D_ZH : ' + JSON.stringify(hits(I.DEFERENCE_ZH, t)));
  console.log('  C_ZH : ' + JSON.stringify(hits(I.CONNECT_ZH || [], t)));
  console.log('  M_EN : ' + JSON.stringify(hits(I.MACHINE_EN, t)));
  console.log('  I_EN : ' + JSON.stringify(hits(I.INFALLIBLE_EN, t)));
  console.log('  D_EN : ' + JSON.stringify(hits(I.DEFERENCE_EN, t)));
  console.log('  C_EN : ' + JSON.stringify(hits(I.CONNECT_EN || [], t)));
}
