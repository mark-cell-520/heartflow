const M = require('../../src/carbon-leakage.js');
const I = M.__internals();
const S = [
  '关闭了本国的钢铁厂，全球的钢铁碳排放自然就下降了。',
  '产业转移到海外，污染治理就不再是我们需要负责的事。',
];
const SHIFT = [I.SHIFT_VERB_ZH, I.SHIFT_NOUN_ZH, I.SHIFT_OUT_ZH];
const N = [...I.NOTOURS_ZH_ARR];
for (const s of S) {
  console.log('样本:', s);
  console.log('  腿①命中:', SHIFT.map((r,i)=>['VERB','NOUN','OUT'][i]+':'+(r.exec(s)?r.exec(s)[0]:'-')).join(' '));
  console.log('  腿② NOTOURS:', N.map(r=>r.exec(s)?r.exec(s)[0]:'-').filter(x=>x!=='-').join(' | ') || '-');
  const s2 = I.SOLVED_ZH_ARR.map(r=>r.exec(s)?r.exec(s)[0]:'-').filter(x=>x!=='-');
  console.log('  腿② SOLVED:', s2.join(' | ') || '-');
  console.log('  hit=', M.detectCarbonLeakage(s).hit);
}
