// [r399 续] 调试 round-693 G2 回归：良性 META 样本现在返回 verify
// 定位是哪个维度承重 + 是否由本轮 genetic-fallacy.js 改动引入。
'use strict';
const path = require('path');
const HF = path.resolve(__dirname, '..', '..');
const gate = require(path.join(HF, 'src/gate.js'));

const t = '父母说「年轻人提出的观点不成熟」，这就是典型的起源谬误';
const r = gate.checkOutput(t);
console.log('sample:', t);
console.log('action:', r.gate.action, '| reason:', r.gate.reason);
console.log('verdict:', r.verdict, '| overallScore:', r.overallScore);
for (const f of (r.findings || [])) {
  console.log('  finding:', f.dimension, 'sev', f.severity, '|', (f.details || '').slice(0, 100));
  console.log('    guidance:', (f.guidance || '').slice(0, 100));
}
const d = gate.discriminate(t);
console.log('--- discriminate 非零维度 ---');
for (const [k, v] of Object.entries(d.dimensions || {})) {
  const c = v && (v.count !== undefined ? v.count : (v.totalHits !== undefined ? v.totalHits : (Array.isArray(v.hits) ? v.hits.length : 0)));
  if (c > 0) console.log('  dim:', k, 'count', c, 'score', v && v.score, '|', (v && v.detail || '').slice(0, 80));
}
console.log('--- checked_by ---');
for (const c of (r.checked_by || [])) console.log(' ', JSON.stringify(c));
