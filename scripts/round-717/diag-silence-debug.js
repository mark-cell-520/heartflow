'use strict';
const m = require('C:/Users/USER782663/heartflow-engine/src/silence-imputation.js');
const I = m.__internals();
function firstIdx(list, text) {
  for (let i = 0; i < list.length; i++) {
    const mm = list[i] instanceof RegExp ? list[i].exec(text) : null;
    if (mm) return { idx: mm.index, re: String(list[i]).slice(0, 40) };
  }
  return { idx: -1 };
}
const t1 = '这么久都不出来澄清，显然是心虚。';
console.log('t1 sil:', firstIdx(I.SILENCE_ZH, t1));
console.log('t1 imp:', firstIdx(I.IMPUTE_ZH, t1));
const t2 = 'No denial has been issued, so the allegations must be true.';
console.log('t2 sil:', firstIdx(I.SILENCE_EN, t2));
console.log('t2 imp:', firstIdx(I.IMPUTE_EN, t2));
console.log('t2 imp pos:', t2.indexOf('must be true'));
// 逐正则看 IMPUTE_ZH 命中情况
for (const re of I.IMPUTE_ZH) {
  const mm = re.exec(t1);
  if (mm) console.log('t1 IMP hit:', String(re).slice(0, 50), '@', mm.index);
}
for (const re of I.SILENCE_ZH) {
  const mm = re.exec(t1);
  if (mm) console.log('t1 SIL hit:', String(re).slice(0, 50), '@', mm.index);
}
