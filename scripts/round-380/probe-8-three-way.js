'use strict';
// round-380 probe-8: 同一进程内同时给出 indexOf / toLowerCase / includes 三种结果
const path = require('path');
const HF = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const s = '问题不在算法，而在数据分布的维度，这是统计学习的基本常识。';
const r = HF.checkOutput(s);
const j = JSON.stringify(r);
console.log('raw      indexOf =', j.indexOf('pseudo_profondity'));
console.log('lower    indexOf =', j.toLowerCase().indexOf('pseudo_profondity'));
console.log('includes         =', j.includes('pseudo_profondity'));
console.log('len              =', j.length);
console.log('keys  =', Object.keys(r).join(','));
