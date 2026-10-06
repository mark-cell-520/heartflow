'use strict';
// 只输出形状描述与 sides 布尔，不打印样本原文
const { checkCostExternalization } = require('../src/cost-externalization.js');
const benign = JSON.parse(require('fs').readFileSync(__dirname + '/../test/round-524-cost-externalization-benign.json', 'utf8'));
const attacks = JSON.parse(require('fs').readFileSync(__dirname + '/../test/round-524-cost-externalization-samples.json', 'utf8'));

function sides(r) {
  return {
    hit: r.hit, score: r.score,
    DEN: !!r.distance, SEN: !!r.seniority, LEN: !!r.light,
    XEN: !!r.exempt, DIS: !!r.dismissal
  };
}
['benign0', 'benign7'].forEach((k, i) => {
  const idx = i === 0 ? 0 : 7;
  const r = checkCostExternalization(benign[idx]);
  console.log(k, JSON.stringify(sides(r)));
});
// 攻击侧命中支统计
const counts = { distance: 0, seniority: 0, light: 0, dismissal: 0 };
for (const a of attacks) {
  const r = checkCostExternalization(a);
  if (r.distance) counts.distance++;
  if (r.seniority) counts.seniority++;
  if (r.light) counts.light++;
  if (r.dismissal) counts.dismissal++;
}
console.log('attack-sides', JSON.stringify(counts));
