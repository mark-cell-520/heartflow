// B4 诊断：哪条腿被守卫拦了
'use strict';
const zpe = require('../../../src/zero-price-effect.js');
const I = zpe.__internals();
const text = 'There was no reason not to take it — people swarmed the booth and cleared it out.';

function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

console.log('--- 腿① ZERO_PRICE_EN 全部命中 ---');
for (const re of I.ZERO_PRICE_EN) for (const x of allMatches(re, text)) {
  console.log(JSON.stringify({ raw: x.raw, idx: x.idx, end: x.end }));
}
console.log('--- 腿② DISTORTION_EN 全部命中 ---');
for (const re of I.DISTORTION_EN) for (const x of allMatches(re, text)) {
  console.log(JSON.stringify({ raw: x.raw, idx: x.idx, end: x.end }));
}

// 手动复刻 matchAlive 判定
const IDIOM = /\b(?:no\s+reason\s+not\s+to|might\s+as\s+well|why\s+not|may\s+as\s+well)\b/i;
console.log('--- IDIOM 在全文命中? ---', IDIOM.test(text));
