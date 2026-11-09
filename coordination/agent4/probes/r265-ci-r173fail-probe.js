// 定位 r173 失败句的 gate findings + 与本轮改动的关系
const { gate } = require('/data/home/heartflow/src/gate.js');
const s = '三个中奖者恰好住在同一条街，这只是巧合，彩票每注都是独立随机事件。';
const r = gate(s);
console.log('gate.action =', r.gate.action);
console.log('findings =', JSON.stringify((r.findings || []).map(f => ({ d: f.dimension, s: f.severity, det: (f.details || '').slice(0, 60) })), null, 1));
const { checkClusteringIllusion } = require('/data/home/heartflow/src/clustering-illusion.js');
console.log('clustering_illusion 模块层 hit =', checkClusteringIllusion(s).hit);
console.log('detail =', checkClusteringIllusion(s).detail);
