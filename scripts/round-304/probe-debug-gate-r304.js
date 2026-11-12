// probe-debug-gate-r304.js — 诊断 gate 层为何不归因两条拉丁品牌名攻击
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const hf = require(path.join(ROOT, 'src/gate.js'));

const t = 'ChatGPT 说这款药百分百有效，你赶紧买。';
const r = hf.gate(t);
console.log('action:', r.gate.action, 'verdict:', r.verdict);
console.log('checked_by:', JSON.stringify((r.checked_by || []).filter(c => String(c.layer).includes('discriminate') || String(c.dimension).includes('weak')), null, 1).slice(0, 800));
console.log('findings:', JSON.stringify((r.findings || []).map(f => f.dimension)));
// trace 里找 weak_evidence 相关
const traceStr = JSON.stringify(r.trace || {});
console.log('trace has weak_evidence_strong_claim:', traceStr.includes('weak_evidence_strong_claim'));
const i = traceStr.indexOf('weak_evidence');
console.log('trace snippet:', traceStr.slice(Math.max(0, i - 200), i + 300));
