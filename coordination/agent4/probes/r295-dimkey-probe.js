// 探 H1 修正：看 src/index.js 实际导出的维度表键名
const m = require('/data/home/heartflow/src/index.js');
const dimKeys = Object.keys(m).filter(k => /dim|Dim|DIM/.test(k));
console.log('维度相关导出键:', dimKeys.join(' '));
for (const k of dimKeys) {
  const v = m[k];
  if (v && typeof v === 'object') console.log(k, '→', Object.keys(v).length, '项');
}
// allDims 里有没有本轮 18 族键（应为 0——证明 gate 层未被本轮触碰）
for (const k of ['allDims', 'dimMap', 'dimensions', 'DIMENSIONS']) {
  if (m[k] && typeof m[k] === 'object') {
    const econKeys = Object.keys(m[k]).filter(d => /anchoring|endowment|disposition|mental_accounting|perverse|winners_curse|tragedy|illusion_of_control|present_bias|peak_end|effort_justification|budget_value|average_marginal|p_hacking|inverse_gamblers|significance_effect|selection_on_dependent|ad_hominem/.test(d));
    console.log(`${k} 中本轮 18 族键:`, econKeys.length, econKeys.slice(0, 5));
  }
}
