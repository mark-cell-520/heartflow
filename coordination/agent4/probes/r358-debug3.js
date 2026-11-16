'use strict';
const { gate } = require('/data/home/heartflow/src/gate.js');
const T = '我们调查了1000名用户，满意度达到87.3%，样本覆盖全国主要城市。';
const r = gate(T);
console.log('action =', r.gate.action);
console.log('findings =', JSON.stringify((r.findings || []).map(f => ({ d: f.dimension, s: f.severity }))));
console.log('verdict =', r.verdict);
