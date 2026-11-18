#!/usr/bin/env node
'use strict';
/* r362 调试：D 组第 4 样本为何模块层已命中 + 良性 FP 的 gate 归因层 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const wr = require(path.join(ROOT, 'src', 'will-rogers-phenomenon.js'));
const hf = require(path.join(ROOT, 'src', 'gate.js'));
const I = wr.__internals();

const samples = [
  'The patients were re-binned into new stages, and both stages did better.',
  'Re-stratifying the patients moved some between stages, and both stages\u2019 survival rose.',
  'Re-stratifying the patients moved some between stages, and both stages\' survival rose.',
];
for (const s of samples) {
  console.log('TEXT:', s);
  console.log('  sigs:', JSON.stringify(I.findSignatures(s)));
}
console.log('=== 良性 FP 全量 findings ===');
const r = hf.check('重新分组后两组成绩屡创新高，但这只是统计假象，需要核对个体数据');
console.log(JSON.stringify({
  action: r.gate ? r.gate.action : r.action,
  reason: r.gate ? r.gate.reason : null,
  findings: (r.findings || []).map(f => ({ dim: f.dimension, sev: f.severity, det: (f.details || '').slice(0, 80) })),
  checked_by: r.checked_by,
}, null, 1));
