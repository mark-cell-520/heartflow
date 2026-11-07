// r240 调试：A11-EN 不命中定位
'use strict';
const m = require('/data/home/heartflow/src/disposition-effect.js');
const t = 'My rule of thumb: bank the gains while they are small, but never realize a loss — wait for it to come back.';
const I = m.__internals();
function all(re, text) { const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'); const o = []; let x; while ((x = g.exec(text)) !== null) { o.push({ idx: x.index, end: x.index + x[0].length, raw: x[0] }); if (x.index === g.lastIndex) g.lastIndex++; } return o; }
console.log('ctx:', JSON.stringify(I.CTX_EN.map(r => all(r, t).map(x => x.raw))));
console.log('winS:', JSON.stringify(I.WIN_STATE_EN.map(r => all(r, t).map(x => x.raw))));
console.log('winD:', JSON.stringify(I.WIN_DISP_EN.map(r => all(r, t).map(x => x.raw))));
console.log('loseS:', JSON.stringify(I.LOSE_STATE_EN.map(r => all(r, t).map(x => x.raw))));
console.log('loseD:', JSON.stringify(I.LOSE_DISP_EN.map(r => all(r, t).map(x => x.raw))));
console.log('loseDn:', JSON.stringify(I.LOSE_DISP_NEG_EN.map(r => all(r, t).map(x => x.raw))));
const r = m.detectDispositionEffect(t);
console.log('hit:', r.hit, JSON.stringify(r.details || '').slice(0, 140));
