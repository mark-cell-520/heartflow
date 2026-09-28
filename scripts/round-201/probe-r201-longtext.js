// 轮 201：定位 ext.longtext 里唯一被 awt 计分的那条，命中族与是否真误伤。
// 只输出命中族与 gate 结论，不输出样本原文。
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const BENCH = path.join(ROOT, 'test');
const awt = require(path.join(ROOT, 'src/shield/ai-writing-tell.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));
const ex = require(path.join(BENCH, 'gate-benchmark-extended.js'));
const arr = (ex.SAMPLES || {}).longtext || [];
let idx = 0;
for (const raw of arr) {
  const text = typeof raw === 'string' ? raw : (raw && raw.text) || '';
  if (!text) continue;
  const r = awt.detect(text);
  if (r.score > 0) {
    console.log(`第 ${idx} 条被计分：score=${r.score} familiesHit=${r.familiesHit} count=${r.count}`);
    for (const f of r.findings || []) console.log(`  dim=${f.dimension} sev=${f.severity} trig=${f.trigger}`);
    const g = gate.checkOutput(text);
    console.log(`  gate.action=${g.gate.action} overall=${g.overallScore}`);
  }
  idx++;
}
console.log('longtext 总数 =', idx);
