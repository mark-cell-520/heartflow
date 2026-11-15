'use strict';
const sb = require('/data/home/heartflow/src/selection-bias.js');
const hf = require('/data/home/heartflow/src/gate.js');

const t1 = '文献库里二十项研究全部显示该药有效，所以这药确实管用。';
console.log('module raw:', JSON.stringify(sb.checkSelectionBias(t1)));
// 找 gate 里的归一化函数
const idx = require('fs').readFileSync('/data/home/heartflow/src/gate.js', 'utf8');
const m = idx.match(/function _normText[\s\S]{0,600}/);
console.log('--- _normText ---');
console.log(m ? m[0] : 'not found in gate.js');
const t2 = 'Every published study shows the supplement works, so it is proven effective.';
console.log('module EN:', JSON.stringify(sb.checkSelectionBias(t2)));
