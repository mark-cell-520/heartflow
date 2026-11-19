'use strict';
const idx = require('/data/home/heartflow/src/index.js');
const s9 = '一个说我偷了东西，一个说没偷，那就算我偷了一半吧';
const r = idx.discriminate(s9);
console.log('findings:', JSON.stringify((r.findings || []).map((f) => ({ d: f.dimension, s: f.severity }))));
const trace = r.trace || (r.checked_by || []);
const atmTrace = JSON.stringify(trace).match(/argument_to_moderation[^,}]*/g);
console.log('atm trace mentions:', atmTrace);
// 全 trace 里出现的所有维度名
const all = JSON.stringify(trace).match(/[a-z_]{6,}\(/g);
console.log('trace dims sample:', all && all.slice(0, 40));
