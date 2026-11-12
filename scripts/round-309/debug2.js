'use strict';
const SODV = require('/data/home/heartflow/src/selection-on-dependent-variable.js');
const I = SODV.__internals();
const t = '康复的患者，他们都心态乐观，所以乐观能治好病';
console.log('CAUSE_ZH[0] test:', I.CAUSE_ZH[0].test('所以乐观能治好病'));
console.log('CAUSE_ZH[0] test full:', I.CAUSE_ZH[0].test(t));
console.log('CAUSE_ZH[0].source:', I.CAUSE_ZH[0].source.slice(0, 120));
// 手动找匹配
const m = t.match(I.CAUSE_ZH[0]);
console.log('match:', m && m[0]);
// 族 C 腿①匹配位置
const selM = [];
I.SELECT2_ZH.forEach((re, i) => { const mm = t.match(re); if (mm) selM.push(i + ':' + mm[0] + '@' + mm.index); });
console.log('SELECT2 matches:', selM.join(' | '));
