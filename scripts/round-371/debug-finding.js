const { checkOutput } = require('/data/home/heartflow/src/gate.js');
const r = checkOutput('基础版功能这么少，专业版只贵一点就显得特别划算。');
const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
console.log(JSON.stringify(f, null, 1).slice(0, 1200));
