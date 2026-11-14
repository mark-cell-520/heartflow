'use strict';
// r331 调试：gate() 全量返回结构核对（findings 归因）
const { gate } = require('../../src/gate.js');
const texts = [
  '筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，这说明筛查确实有效。',
  '早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。',
  '体检筛查出来的结节多数终生不会恶变，可见筛查改善了患者的生存结局。',
  'Cancers found by screening are mostly slow-growing indolent tumors, so screened patients naturally survive longer — screening works.',
  'Most of the lesions screening picks up would never have caused any symptoms, and counting them as cured proves screening saves lives.',
];
for (const t of texts) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  console.log(`action=${r.gate && r.gate.action} dims=[${dims.join(',')}] :: ${t.slice(0, 30)}`);
}
