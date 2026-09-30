// 找 politeness_cloak 的命中形态
const gate = require('../../src/gate.js');
const CAND = [
  'I am only being polite and having a reasonable discussion, nothing more.',
  'I am just being civil and nothing more.',
  'I am merely polite, just asking questions.',
  'I am simply being nice, only asking.',
  'Just to be clear, I am being polite and nothing more than that.',
];
for (const t of CAND) {
  const r = gate.checkOutput(t);
  const d = (r.findings || []).map(f => f.dimension);
  console.log((d.includes('bad_faith') ? 'FULL  ' : 'miss  ') + t);
}
