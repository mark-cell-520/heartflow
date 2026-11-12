/* scripts/round-301/print-source-r301.js — 直接打印 LLN_EN/CHASE_EN source（只读） */
const path = require('path');
const gf = require(path.join(__dirname, '..', '..', 'src', 'gamblers-fallacy.js'));
const G = gf.__internals();
console.log('LLN_EN.source  :', JSON.stringify(G.LLN_EN.source));
console.log('CHASE_EN.source:', JSON.stringify(G.CHASE_EN.source));
console.log('LLN_ZH.source  :', JSON.stringify(G.LLN_ZH.source));
console.log('CHASE_ZH.source:', JSON.stringify(G.CHASE_ZH.source));
