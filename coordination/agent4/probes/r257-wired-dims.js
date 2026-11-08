// r257: 列出已接线维度（dimMap 键）实测
const hf = require('/data/home/heartflow/src/gate.js');
const r = hf.gate('你好，请帮我看看这份报告。');
const dims = (r && r.dimensions) ? Object.keys(r.dimensions) : [];
console.log('WIRED_DIM_COUNT=' + dims.length);
console.log(dims.sort().join('\n'));
