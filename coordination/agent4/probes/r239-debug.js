// r239 调试：两条未命中攻击的腿匹配诊断
'use strict';
const path = require('path');
const { detectIllusionOfControl, __internals } = require(path.join(__dirname, '..', '..', '..', 'src', 'illusion-of-control.js'));

const t1 = '摇号买房前她去庙里上了香，回来告诉我们这回中签的希望大了不少。';
const t2 = 'Wearing his lucky socks to the casino increases his chance of hitting the jackpot.';
const I = __internals();

function allM(re, text) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const o = []; let m;
  while ((m = g.exec(text)) !== null) { o.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] }); if (m.index === g.lastIndex) g.lastIndex++; }
  return o;
}

for (const [name, A, B, C, text] of [['ZH', I.A_ZH, I.B_ZH, I.C_ZH, t1], ['EN', I.A_EN, I.B_EN, I.C_EN, t2]]) {
  console.log('--- ' + name + ' ---');
  console.log('A:', JSON.stringify(allM(new RegExp(A.map(r => r.source).join('|')), text).map(x => [x.raw, x.idx])));
  console.log('B:', JSON.stringify(allM(new RegExp(B.map(r => r.source).join('|')), text).map(x => [x.raw, x.idx])));
  console.log('C:', JSON.stringify(allM(new RegExp(C.map(r => r.source).join('|')), text).map(x => [x.raw, x.idx])));
}
console.log('r1:', JSON.stringify(detectIllusionOfControl(t1)));
console.log('r2:', JSON.stringify(detectIllusionOfControl(t2)));
