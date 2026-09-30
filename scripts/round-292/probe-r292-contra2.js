/**
 * r292 探针 15：样本「全角→半角」逐维度得分归因
 * 用 gate 级这 1 条回归样本倒推是哪个维度丢了分。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const src = fs.readFileSync(path.join(ROOT, 'test/lang-coverage-fill.test.js'), 'utf8');
const m = src.match(/'([^']*\u6709[^']*\uFF0C[^']*\u4F46[^']*)'/g) || [];
const target = m.map(s => s.slice(1, -1)).find(s => s.includes('\u4F46') && s.includes('\u5E76')) || m.map(s => s.slice(1, -1))[0];

function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

for (const [label, text] of [['全角原文', target], ['折叠后半角', pipeNormalize(target)]]) {
  const r = gate.gate(text);
  console.log(`\n══ ${label} ══ action=${r.gate.action} score=${r.overallScore}`);
  const dims = {};
  for (const t of (r.trace || [])) {
    if (!t || !t.dimension) continue;
    dims[t.dimension] = t;
  }
  for (const [d, t] of Object.entries(dims)) {
    console.log(`  ${d}: score=${t.score} ${t.hits ? 'hits=' + t.hits : ''} ${t.evidence ? JSON.stringify(t.evidence).slice(0, 90) : ''}`);
  }
  if (r.findings) for (const f of r.findings) console.log(`  [finding] ${f.dimension} sev=${f.severity}`);
}
