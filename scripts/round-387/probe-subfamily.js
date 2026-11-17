'use strict';
const path = require('path');
// 逐个子族模块直接跑，看谁命中 zh[0]
const mods = [
  ['significance-effect-size', 'detectSignificanceEffectSize'],
  ['p-hacking', 'detectPHacking'],
  ['effect-measure-misread', 'detectEffectMeasureMisread'],
];
const t = '结果接近显著水平（p = 0.06），说明干预措施确实有效。';
for (const [m, fn] of mods) {
  try {
    const M = require('../../src/' + m + '.js');
    const f = M[fn];
    if (typeof f !== 'function') { console.log(m, 'no fn'); continue; }
    const r = f(t);
    console.log(m, JSON.stringify(r).slice(0, 400));
  } catch (e) { console.log(m, 'ERR', e.message); }
}
