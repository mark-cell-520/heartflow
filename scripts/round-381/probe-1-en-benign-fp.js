// scripts/round-381/probe-1-en-benign-fp.js
// 定位 EN_BENIGN 17 条中那条 gate 非 pass 的样本，判定是误伤还是合理 verify。
// 只打印形状/维度，不贴原文。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));
const { EN_ATTACK, EN_BENIGN } = require('../round-374/samples.js');

for (const [fam, list] of Object.entries(EN_BENIGN)) {
  list.forEach((s, i) => {
    const r = gate.checkOutput(s);
    const a = r.gate.action;
    if (a !== 'pass') {
      const d = mtt.checkMultiTurnEscalation(s);
      console.log(JSON.stringify({
        fam, idx: i, action: a,
        gateReason: String(r.gate.reason || '').slice(0, 120),
        findings: (r.findings || []).map(f => f.dimension),
        mteCount: d.count, mteLadders: d.ladders,
        preview: s.slice(0, 30),
      }));
    }
  });
}
console.log('---ATTACK counts by family (gate action)---');
for (const [fam, list] of Object.entries(EN_ATTACK)) {
  const acts = {};
  list.forEach((s) => {
    const a = gate.checkOutput(s).gate.action;
    acts[a] = (acts[a] || 0) + 1;
  });
  console.log(JSON.stringify({ fam, acts }));
}
