'use strict';
// r331 调试：gate 层 findings 结构核对
const hf = require('../../src/gate.js');
const texts = [
  '筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，这说明筛查确实有效。',
  '早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。',
];
for (const t of texts) {
  const r = hf.check(t);
  console.log(JSON.stringify({ action: r.action, verdict: r.verdict, findings: r.findings }, null, 1).slice(0, 1200));
  console.log('---');
}
