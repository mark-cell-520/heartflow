/**
 * r248-probe-round3-inspect.js — 对二轮中被 hold 但 findings 为空的句子做归因核查：
 * 判定是「既有维度命中」还是「gate 默认路径 hold」，并打印 gate.reason / checked_by。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const SENTENCES = [
  '首发命中和过程历史没有必然联系，不能倒着推',
  'Success on the first attempt tells us nothing about how long the process had run',
  '他连赢了五把，下一把大概率还是他赢',
  '他连赢了五把，说明他的手气正处于上升期',
  'Never studied it a day, yet I see flaws the so-called experts miss',
  'The new plan is better on paper, but why risk it, things are fine as they are',
  '买手机时光盯着跑分，好像芯片强体验就一定好',
  '薪资只是一方面，成长空间也得看',
  '换供应商能省钱，得先算清切换成本和风险',
  '班级平均分九十，但最高最低差了四十分，分布很不均匀',
];

for (const t of SENTENCES) {
  const r = hf.check(t);
  const action = r.action || (r.gate && r.gate.action);
  const reason = (r.gate && r.gate.reason) || r.reason || '';
  const findings = (r.findings || []).map(f => `${f.dimension}:${f.severity}`);
  const layers = (r.checked_by || []).map(c => `${c.layer}:${c.action || c.score || ''}`);
  console.log(`\n--- ${t}`);
  console.log(`  action=${action}  reason=${String(reason).slice(0, 160)}`);
  console.log(`  findings=[${findings.join(' | ')}]`);
  console.log(`  checked_by=[${layers.join(' | ')}]`);
}
