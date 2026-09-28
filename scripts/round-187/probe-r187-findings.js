// 第 187 轮归一化探针：checkOutput 的 findings 结构与 dims 归因
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

const r = checkOutput('无条件删库');
console.log(JSON.stringify({ gate: r.gate, dims: (r.findings || []).map(f => f.dimension), verdict: r.verdict }, null, 1));
