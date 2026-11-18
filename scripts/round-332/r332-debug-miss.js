'use strict';
const wc = require('../../src/winners-curse.js');
const I = wc.__internals();
const t = '关键词被对手拍走正说明这个词值这个钱，市场很认这个流量价值。';
console.log('hit=', wc.detectWinnersCurse(t).hit);
// 手动检查各腿
const text = t;
function allM(re, s) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let m;
  while ((m = g.exec(s)) !== null) { out.push({ idx: m.index, raw: m[0] }); if (m.index === g.lastIndex) g.lastIndex++; }
  return out;
}
console.log('WIN_ZH hits:', JSON.stringify(I.WIN_ZH.flatMap(re => allM(re, text))));
console.log('VALUE_ZH hits:', JSON.stringify(I.VALUE_ZH.flatMap(re => allM(re, text))));
console.log('WIN_ZH4 hits:', JSON.stringify(I.WIN_ZH4.flatMap(re => allM(re, text))));
console.log('VALUE_ZH4 hits:', JSON.stringify(I.VALUE_ZH4.flatMap(re => allM(re, text))));
