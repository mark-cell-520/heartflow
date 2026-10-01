// r362 探针 5：对比 gate.js 与 index.js 两路 discriminate 在同一句上的返回差异
'use strict';
const g = require('../../src/gate.js');
const idx = require('../../src/index.js');
const t = '由于换了招财头像，这个个月的订单明显多了';
const dg = g.discriminate(t);
const di = idx.discriminate(t);
console.log('gate.js  dims.pc = ' + JSON.stringify(dg.dimensions && dg.dimensions.pseudo_causal));
console.log('index.js dims.pc = ' + JSON.stringify(di.dimensions && di.dimensions.pseudo_causal));
const fg = (dg.findings || []).find(x => x.dimension === 'pseudo_causal');
const fi = (di.findings || []).find(x => x.dimension === 'pseudo_causal');
console.log('gate.js  findings.pc = ' + (fg ? 'yes' : 'no') + '  index.js findings.pc = ' + (fi ? 'yes' : 'no'));
