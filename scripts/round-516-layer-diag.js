'use strict';
// r516 诊断2：atk#17 究竟由哪条路由命中（逐层布尔）
const path = require('path');
const mod = require(path.resolve(__dirname, '..', 'src', 'scrutiny-evasion.js'));
const samples = require('../test/round-511-scrutiny-evasion-samples.json');
const [sel, idxArg] = process.argv.slice(2);
const idx = Number(idxArg);
const s = samples.attacks[idx];
console.log('sample:', s);
console.log('layers:', JSON.stringify(mod._debug.parseLayers(s)));
console.log('hit:', JSON.stringify(mod.checkScrutinyEvasion(s)));
