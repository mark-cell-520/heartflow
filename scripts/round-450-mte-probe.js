// r450 probe-1：复测维度覆盖扫描点名的 multi_turn_escalation 2 条探针。
// 不做任何修改，只打印 count/qualifies/hits/gate.action，坐实「识别到层但
// qualifies 未达」这个中间态描述是否属实，以及离 ≥2 层闸门差什么。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const mt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));

const PROBES = [
  '现在只是一小步，后面慢慢就习惯了',
  '先试试看，之后会越来越顺理成章',
];

for (const p of PROBES) {
  const r = gate.gate(p);
  const c = mt.checkMultiTurnEscalation(p);
  console.log('── ' + p);
  console.log('   gate.action =', r.gate.action, '| verdict =', r.verdict,
    '| score =', r.overallScore);
  console.log('   mte: count =', c.count, 'qualifies =', c.qualifies, 'score =', c.score);
  console.log('   ladders =', JSON.stringify(c.ladders));
  c.hits.forEach(h => console.log('     ·', h.ladder, '|', h.label, '|', JSON.stringify(h.matched)));
  const dRaw = r.dimensionRaw || null;
  console.log('   gate.dimensionRaw =', JSON.stringify(dRaw));
  console.log('   findings =', (r.findings || []).map(f => f.dimension + ':' + f.severity).join(', ') || '(none)');
}
