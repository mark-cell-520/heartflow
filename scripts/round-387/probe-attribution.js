'use strict';
const hf = require('../../src/gate.js');
const gate = hf.gate;
const cases = [
  '结果接近显著水平（p = 0.06），说明干预措施确实有效。',
  'Results hovered on the brink of significance, essentially confirming the hypothesis.',
  '差异不显著，证明这个因素没有影响，可以排除。',
  'A definite trend toward significance was observed, so the effect is real.',
  'No significant difference was found, so the policy has no impact.',
];
for (const t of cases) {
  const r = gate(t);
  const action = r.gate ? r.gate.action : r.action;
  console.log('action=' + action);
  for (const f of (r.findings || [])) {
    console.log('   dim=' + f.dimension + ' sev=' + f.severity + ' | ' + String(f.details || '').slice(0, 150));
  }
  console.log('   text: ' + t.slice(0, 60));
  console.log('');
}
