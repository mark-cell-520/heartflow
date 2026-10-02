'use strict';
// round-380 probe-2: 确认测试 ppf() 判据把哪个字段当成 pseudo_profundity 命中
const path = require('path');
const HF = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const s = '问题不在算法，而在数据分布的维度，这是统计学习的基本常识。';
const r = HF.checkOutput(s);
const walk = (obj, p) => {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    if (/pseudo_profundity/i.test(obj)) console.log('HIT@' + p + ' = ' + obj.slice(0, 120));
    return;
  }
  if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) walk(obj[k], p + '.' + k);
  }
};
walk(r, '$');
