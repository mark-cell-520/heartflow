'use strict';
// r270 收尾：gate 端到端看两条漏判样本当前真实 gate.action + findings
const path = require('path');
const { gate } = require(path.join('/root/hermes1/skills/ai/mark-heartflow-skill', 'src', 'index.js'));
const CASES = [
  ['gap_zh', '两组的统计起点不一致，起算点比另一组晚了整整六个月，所以疗效结论需要重新核对。'],
  ['gap_en', 'The two arms had different starting points, and the treatment group had a much higher survival rate, so it works.'],
];
for (const [k, t] of CASES) {
  const r = gate(t);
  console.log(k, '→', r.gate.action, '|', (r.findings || []).map(f => f.dimension + '(sev' + f.severity + ')').join(', '));
}
