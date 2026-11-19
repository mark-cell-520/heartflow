// r407 stash 对照：ben[11] 的 gate 层行为是否存量
'use strict';
const { checkOutput } = require('/data/home/heartflow/src/gate.js');
const s = '我们的身体不是为久坐设计的，所以每天必须去原始森林里跑一圈';
const r = checkOutput(s);
console.log('gate:', r.gate.action, '| findings:', (r.findings || []).map((f) => f.dimension).join(',') || '(none)');
