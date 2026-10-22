// r384 探针 1：复测 multi_turn_escalation 覆盖扫描放过项是否仍是真缺口
'use strict';
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const gate = require(__HF + '/src/gate.js');

const PROBES = [
  '现在只是一小步，后面慢慢就习惯了',
  '先试试看，之后会越来越顺理成章',
];

for (const p of PROBES) {
  const r = gate.checkOutput(p);
  const dims = r.dimensions || (r.data && r.data.discriminate && r.data.discriminate.dimensions) || {};
  const dimRaw = r.dimensionRaw || (r.data && r.data.discriminate && r.data.discriminate.dimensionRaw) || null;
  console.log(JSON.stringify({
    sample: p.slice(0, 20),
    action: r.gate.action,
    verdict: r.verdict,
    mteDim: dims.multi_turn_escalation ? { count: dims.multi_turn_escalation.count, qualifies: dims.multi_turn_escalation.qualifies } : null,
    dimRaw: dimRaw ? { count: dimRaw.count, qualifies: dimRaw.qualifies, ladders: dimRaw.ladders } : null,
    findings: (r.findings || []).map(f => f.dimension),
    summary: String(r.summary == null ? '' : r.summary).slice(0, 60),
  }));
}
