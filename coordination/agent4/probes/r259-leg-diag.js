// r259 定向诊断：为什么 'This is a century-old recipe, so do not change it.' 不命中
const m = require('/data/home/heartflow/src/appeal-tradition.js');
const I = m.__internals();
const t = 'This is a century-old recipe, so do not change it.';
console.log('TRADITION_EN century-old:', I.TRADITION_EN.test(t));
console.log('SUPP_EN e10:', I.SUPP_EN_BRANCHES.e10_do_not_change.test(t));
console.log('module:', JSON.stringify(m.checkAppealToTradition(t)));
const sents = t.split(/[。！？!?\n]+/).map(s => s.trim()).filter(Boolean);
console.log('sentences:', JSON.stringify(sents));
const s = sents[0];
console.log('hedgeCEn:', I.HEDGE_CONCESSION_EN.test(s), 'hedgeEEn:', I.HEDGE_EVAL_EN.test(s));
// 零重叠检查
function collect(re, text) {
  const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
  const out = []; let mm;
  while ((mm = g.exec(text)) !== null) { if (mm[0].length === 0) { g.lastIndex++; continue; } out.push([mm.index, mm.index + mm[0].length, mm[0]]); }
  return out;
}
console.log('tradSpans:', JSON.stringify(collect(I.TRADITION_EN, s)));
console.log('suppSpans:', JSON.stringify(collect(I.SUPP_EN_BRANCHES.e10_do_not_change, s)));
