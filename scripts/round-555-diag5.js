'use strict';
const M = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/loyalty-by-omission.js');
const K = M.__internals();
const D = K.DEMEAN_EN;
console.log('flags:', String(D).slice(-3));
// 拆解每个分支单独测
const branches = String(D).slice(1, -2).split(').*').length;
console.log('branch count approx:', branches);
const probes = ['the enemy', 'a traitor', 'disloyal', 'an enemy', 'enemy'];
for (const p of probes) console.log(p, '=>', D.test(p));
