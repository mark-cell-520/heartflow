'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const s9 = '一个说我偷了东西，一个说没偷，那就算我偷了一半吧';
const r = hf.checkOutput(s9);
console.log('gate:', JSON.stringify(r.gate));
console.log('checked_by:', JSON.stringify(r.checked_by));
console.log('findings:', JSON.stringify((r.findings || []).map((f) => ({ d: f.dimension, s: f.severity }))));
