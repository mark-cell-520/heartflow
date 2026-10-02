'use strict';
// round-380 probe-4: 找到 JSON.stringify(result) 中 pseudo_profundity 出现的下标与上下文
const path = require('path');
const HF = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const s = '问题不在算法，而在数据分布的维度，这是统计学习的基本常识。';
const r = HF.checkOutput(s);
const j = JSON.stringify(r);
const idx = j.toLowerCase().indexOf('pseudo_profundity');
console.log('idx=' + idx + ' len=' + j.length);
console.log('CTX: ' + j.slice(Math.max(0, idx - 400), idx + 300));
