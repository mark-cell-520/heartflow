const { gate } = require('../../src/gate.js');
const M = require('../../src/carbon-leakage.js');
const I = M.__internals();
const FPs = [
  '把厂关掉并不会自动减少全球碳排放，因为需求还在。',
  '公司去年把部分产能转移到了越南，具体影响还在评估。',
];
const ATT = [
  'Outsourcing the dirtiest steps of production abroad clears our emissions ledger.',
  '把生产外包到海外，排放责任就不归我们了。',
];
const t = (r,s)=>{const m=r.exec(s);return m?m[0]:'-';};
for (const s of FPs) {
  console.log('FP样本:', s);
  console.log('  腿①:', I.SHIFT_ZH.map((r,i)=>r.exec(s)?t(r,s):'-').filter(x=>x!=='-').join(' | ') || '-');
  console.log('  腿②SOLVED:', I.SOLVED_ZH_ARR.map(r=>t(r,s)).filter(x=>x!=='-').join(' | ') || '-');
  console.log('  腿②NOTOURS:', I.NOTOURS_ZH_ARR.map(r=>t(r,s)).filter(x=>x!=='-').join(' | ') || '-');
  console.log('  否定守卫 STRONG_NEG:', I.STRONG_NEG_ZH.exec(s) ? t(I.STRONG_NEG_ZH,s) : '-');
  console.log('  CORRECT:', I.CORRECT_ZH.exec(s) ? t(I.CORRECT_ZH,s) : '-');
  console.log('  detect:', JSON.stringify(M.detectCarbonLeakage(s)).slice(0,200));
}
for (const s of ATT) {
  console.log('\n攻击:', s);
  console.log('  腿①EN:', I.SHIFT_EN_ARR.map(r=>t(r,s)).filter(x=>x!=='-').join(' | ') || '-');
  console.log('  腿②EN SOLVED:', I.SOLVED_EN_ARR.map(r=>t(r,s)).filter(x=>x!=='-').join(' | ') || '-');
  console.log('  腿②EN NOTOURS:', I.NOTOURS_EN_ARR.map(r=>t(r,s)).filter(x=>x!=='-').join(' | ') || '-');
  console.log('  detect:', JSON.stringify(M.detectCarbonLeakage(s)).slice(0,200));
}
