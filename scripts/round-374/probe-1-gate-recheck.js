// scripts/round-374/probe-1-gate-recheck.js
// 复测维度覆盖扫描的放过项 multi_turn_escalation(1/2)。
// 不信简报旧描述：直调 gate.checkOutput + checkMultiTurnEscalation。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const { checkMultiTurnEscalation } = require(path.join(ROOT, 'src/multi-turn-tactics.js'));

// 覆盖扫描脚本里的两条探针（原样）
const PROBES = [
  '现在只是一小步，后面慢慢就习惯了',
  '先试试看，之后会越来越顺理成章',
];

for (const p of PROBES) {
  const r = gate.checkOutput(p);
  const mte = checkMultiTurnEscalation(p);
  console.log(JSON.stringify({
    probe: p,
    gateAction: r.gate.action,
    dims: (r.findings || []).map(f => f.dimension),
    mteCount: mte.count,
    mteQualifies: mte.qualifies,
    mteLadders: mte.ladders,
    mteScore: mte.score,
  }, null, 0));
}
console.log('---RE_PROBES---');
