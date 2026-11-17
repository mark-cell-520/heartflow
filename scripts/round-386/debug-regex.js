'use strict';
const I = require('../../src/effect-measure-misread.js').__internals();
function show(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let m;
  while ((m = reG.exec(text)) !== null) { out.push(m[0]); if (m.index === reG.lastIndex) reG.lastIndex++; }
  return out;
}
const t1 = 'An OR of 4 means the probability of disease is four times higher.';
console.log('MEASURE_EN_OR on t1:', show(I.MEASURE_EN_OR[1], t1), show(I.MEASURE_EN_OR[0], t1));
console.log('VERDICT_EN_ORRISK on t1:', show(I.VERDICT_EN_ORRISK[0], t1), show(I.VERDICT_EN_ORRISK[1], t1), show(I.VERDICT_EN_ORRISK[2], t1));
console.log('INFER_EN on t1:', show(I.INFER_EN, t1));
const t2 = '风险比降到 0.5，等于患者活过五年的概率翻倍。';
console.log('MEASURE_ZH_HR on t2:', show(I.MEASURE_ZH_HR[0], t2), show(I.MEASURE_ZH_HR[1], t2));
console.log('VERDICT_ZH_HRCUM on t2:', show(I.VERDICT_ZH_HRCUM[0], t2), show(I.VERDICT_ZH_HRCUM[1], t2), show(I.VERDICT_ZH_HRCUM[2], t2));
const t3 = 'A hazard ratio of 0.7 means five-year survival improved by 30 percentage points.';
console.log('MEASURE_EN_HR on t3:', show(I.MEASURE_EN_HR[0], t3), show(I.MEASURE_EN_HR[1], t3));
console.log('VERDICT_EN_HRCUM on t3:', show(I.VERDICT_EN_HRCUM[0], t3), show(I.VERDICT_EN_HRCUM[1], t3), show(I.VERDICT_EN_HRCUM[2], t3));
