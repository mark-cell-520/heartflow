'use strict';
// r368 ACCUM_EN 调试
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const mc = require(path.join(ROOT, 'src', 'mercantilism.js'));
const I = mc.__internals();
const t = 'The country accumulates wealth through persistent trade surpluses.';
console.log('ACCUM_EN match:', I.ACCUM_EN.test(t));
console.log('TRADE_NOUN_EN match:', I.TRADE_NOUN_EN.test(t));
for (const [k, v] of Object.entries(I)) {
  if (v instanceof RegExp && v.test(t)) console.log('  hit:', k, '=>', String(v).slice(0, 80));
}
const r = mc.detectMercantilism(t);
console.log('detect:', JSON.stringify(r, null, 2).slice(0, 400));
// 变体探测：把 persistent 去掉
const t2 = 'The country accumulates wealth through trade surpluses.';
console.log('t2 hit:', mc.detectMercantilism(t2).hit, 'ACCUM_EN:', I.ACCUM_EN.test(t2));
const t3 = 'Nations accumulate wealth through persistent trade surpluses.';
console.log('t3 hit:', mc.detectMercantilism(t3).hit, 'ACCUM_EN:', I.ACCUM_EN.test(t3));
