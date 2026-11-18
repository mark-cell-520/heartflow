'use strict';
const wc = require('../../src/winners-curse.js');
const I = wc.__internals();
function allM(re, s) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let m;
  while ((m = g.exec(s)) !== null) { out.push({ i: m.index, raw: m[0] }); if (m.index === g.lastIndex) g.lastIndex++; }
  return out;
}
function dump(label, t) {
  console.log('==== ' + label);
  console.log('  WIN_ZH :', JSON.stringify(I.WIN_ZH.flatMap(r => allM(r, t))));
  console.log('  WIN_ZH4:', JSON.stringify(I.WIN_ZH4.flatMap(r => allM(r, t))));
  console.log('  VAL_ZH :', JSON.stringify(I.VALUE_ZH.flatMap(r => allM(r, t))));
  console.log('  VAL_ZH4:', JSON.stringify(I.VALUE_ZH4.flatMap(r => allM(r, t))));
  console.log('  WIN_EN :', JSON.stringify(I.WIN_EN.flatMap(r => allM(r, t))));
  console.log('  WIN_EN4:', JSON.stringify(I.WIN_EN4.flatMap(r => allM(r, t))));
  console.log('  VAL_EN :', JSON.stringify(I.VALUE_EN.flatMap(r => allM(r, t))));
  console.log('  VAL_EN4:', JSON.stringify(I.VALUE_EN4.flatMap(r => allM(r, t))));
}
dump('EN outbid', 'We outbid everyone for the premium keyword, so the slot was clearly worth it.');
dump('ZH ②-i', '竞拍到关键词说明市场认可这个价值。');
dump('EN worth it', 'We outbid everyone for the premium keyword, so the slot was clearly worth it.');
dump('ZH 拍走', '最后一件拍品被我们拍走了，说明市场认可它的价值。');
