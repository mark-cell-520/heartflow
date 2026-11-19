'use strict';
const { gate } = require('/data/home/heartflow/src/gate.js');
const hf = require('/data/home/heartflow/src/gate.js');
const t = '要么照做，要么滚蛋';
const a = gate(t);
const b = hf.checkOutput(t);
console.log('gate():', JSON.stringify({ action: a.gate.action, dims: (a.findings || []).map(f => f.dimension) }));
console.log('checkOutput():', JSON.stringify({ action: b.gate.action, dims: (b.findings || []).map(f => f.dimension) }));
