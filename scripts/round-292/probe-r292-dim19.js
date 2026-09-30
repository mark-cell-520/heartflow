/**
 * r292 探针 19：对 [17] 号句逐维度归因，找出折叠后丢分的维度
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const idx = require(path.join(ROOT, 'src/index.js'));

function fwPunctFold(s) {
  return s.replace(/[\uFF0C\uFF01\uFF1F\uFF1A\uFF1B\uFF08\uFF09\uFF0D\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
}
const src = fs.readFileSync(path.join(ROOT, 'test/lang-coverage-fill.test.js'), 'utf8');
const all = [...src.matchAll(/'([^'\n]{8,200})'/g)].map(m => m[1]).filter(s => /[\u4e00-\u9fff]/.test(s));
const s = all[17];
console.log('目标句长:', s.length);
console.log('含全角逗号:', s.includes('\uFF0C'));

for (const [label, text] of [['全角原文', s], ['折叠后半角', fwPunctFold(s)]]) {
  const r = gate.gate(text);
  console.log(`\n══ ${label} ══ action=${r.gate.action} score=${r.overallScore}`);
  for (const t of (r.trace || [])) {
    if (!t || !t.dimension) continue;
    console.log(`  ${t.dimension}: ${JSON.stringify(t).slice(0, 160)}`);
  }
  for (const f of (r.findings || [])) console.log(`  [finding] ${f.dimension} sev=${f.severity} ${String(f.details || '').slice(0, 60)}`);
  // contradiction 专项
  const c = idx.checkContradiction(text);
  console.log(`  checkContradiction: count=${c.count} contradictions=${JSON.stringify(c.contradictions).slice(0, 200)}`);
}
