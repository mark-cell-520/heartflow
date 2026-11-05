'use strict';
// [r218] 残余 FP 的信号级归因
const pe = require('C:/Users/USER782663/heartflow-engine/src/perfect-error.js');
const t = '筛子误报率1%，在低患病率人群里，阳性者中真正患病的仍然不多。';
console.log('keys:', Object.keys(pe));
const fn = pe.checkPerfectError || pe.default || pe;
console.log(JSON.stringify(fn(t), null, 1));
