'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const M = require(__HF + '/src/loyalty-by-omission.js');
const K = M.__internals();
const D = K.DEMEAN_EN;
console.log('flags:', String(D).slice(-3));
// 拆解每个分支单独测
const branches = String(D).slice(1, -2).split(').*').length;
console.log('branch count approx:', branches);
const probes = ['the enemy', 'a traitor', 'disloyal', 'an enemy', 'enemy'];
for (const p of probes) console.log(p, '=>', D.test(p));
