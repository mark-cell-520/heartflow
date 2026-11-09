'use strict';
const path = require('path');
const { gate } = require(path.join('/root/hermes1/skills/ai/mark-heartflow-skill', 'src', 'gate.js'));
const CASES = [
  ['gap_zh', '两组的统计起点不一致，起算点比另一组晚了整整六个月，所以疗效结论需要重新核对。'],
  ['gap_en', 'The two arms had different starting points, and the treatment group had a much higher survival rate, so it works.'],
  ['std_zh', '治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。'],
  ['std_en', 'Patients who survived the first year after treatment lived much longer, so the treatment works.'],
  ['benign_zh', '战争是多因共同造成的。'],
  ['benign_med', '两组均从确诊同一天起算生存期，采用随机对照设计，差异需进一步核对。'],
];
for (const [k, t] of CASES) {
  const r = gate(t);
  console.log(k, '→', r.gate.action, '|', (r.findings || []).map(f => f.dimension + '(sev' + f.severity + ')').join(', '));
}
