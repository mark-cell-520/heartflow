// r378 诊断三条残余 miss
const mod = require('../../src/relative-risk-individual-transfer.js');
const I = mod.__internals();
const CASES = [
  '群体的相对风险降到三成，落到每个人头上也是三成',
  'In relative terms the population risk is a third lower, so each participant is a third lower.',
  '相对风险下降 25%，个人相对风险也下降 25%',
];
for (const t of CASES) {
  const zh = /[\u4e00-\u9fff]/.test(t);
  console.log('TEXT: ' + t + '  [zh=' + zh + ']');
  (zh ? I.GROUP_ZH : I.GROUP_EN).forEach((re, i) => { const m = t.match(re); if (m) console.log(`  GROUP[${i}] ${JSON.stringify(m[0])} @${m.index}`); });
  (zh ? I.INDIV_ZH : I.INDIV_EN).forEach((re, i) => { const m = t.match(re); if (m) console.log(`  INDIV[${i}] ${JSON.stringify(m[0])} @${m.index}`); });
  console.log('  hit=' + mod.checkRelativeRiskIndividualTransfer(t).hit);
}
