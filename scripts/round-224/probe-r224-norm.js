// scripts/round-224/probe-r224-norm.js
// 为什么纯英文 'This is the most reliable approach.' 是 pass？
// 逐层看：_normText → checkConfidenceCalibration → issues 数量 → score。
const idx = require('../../src/index.js');

const samples = [
  'This is the most reliable approach.',
  'The quietest dishwasher on the market.',
  'It is the safest stroller you can buy.',
  '他说这是 the most reliable 的方案。',
];

for (const s of samples) {
  const r = idx.checkConfidenceCalibration(s);
  console.log(JSON.stringify({ input: s.slice(0, 30), count: r.count, score: r.score,
    issues: r.issues.map(i => i.detail) }));
}

// 看 gate 里怎么消费 confidence 维度
const gate = require('../../src/gate.js');
for (const s of samples) {
  const g = gate.checkOutput(s);
  console.log('gate:', g.gate.action, JSON.stringify((g.findings || []).map(f => f.dimension)));
}
