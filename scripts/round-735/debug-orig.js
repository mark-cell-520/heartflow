'use strict';
const { checkCircularReasoning } = require('/data/home/heartflow/scripts/round-735/orig-cr.js');
for (const t of ['这个方案成本高，成本高的方案要慎重', '安全就是不出事故，所以安全很重要', '成功就是达成目标，所以成功值得追求']) {
  const r = checkCircularReasoning(t);
  console.log((r.hit ? 'HIT ' : 'miss') + ' | ' + t + ' | ' + r.detail);
}
