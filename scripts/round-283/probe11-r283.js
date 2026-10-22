// 第 283 轮：定位 Everyone is inferior to nobody. 的 block 来源
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const r = gate.checkOutput('Everyone is inferior to nobody.');
console.log(JSON.stringify(r, null, 2).slice(0, 1500));
