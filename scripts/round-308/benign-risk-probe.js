// r307 良性风险面实测：新 VAGUE 词 × 常见良性建议句
'use strict';
const SOR = require('/data/home/heartflow/src/sorites-fallacy.js');
const gate = require('/data/home/heartflow/src/gate.js');

const RISKY_BENIGN = [
  '减肥要靠长期饮食控制，一天两天看不出变化',
  '健康是累积出来的，不是一天不睡就能垮的',
  '进度落后要靠每天赶一点，急不来',
  '周报只是同步工具，写不写看团队约定',
  '身体需要休息，偶尔熬一次夜不必有心理负担',
  '进度管理看节奏，一次延误不决定成败',
  'one cookie a day does not ruin a diet in the long run',
  'sleep adds up over weeks, so one late night is not decisive',
  'fitness is built gradually, a single workout changes little',
  'your schedule has slack, one slipped deadline is recoverable',
  '锻炼重在坚持，少练一次无伤大雅',
  '少喝一杯酒不会影响健康，但长期酗酒会',
  '一天不学习不会掉队，关键在于长期坚持',
  '偶尔一次失眠没关系，长期才需要干预',
  '进度落后是正常的，一次迭代追不回来',
];
for (const t of RISKY_BENIGN) {
  const m = SOR.checkSoritesFallacy(t);
  const gf = gate.gate(t);
  const attr = (gf.findings || []).some(f => f.dimension === 'sorites_fallacy');
  console.log(JSON.stringify({ t: t.slice(0, 36), mod: m.hit ? 'HIT' : 'miss', action: gf.gate.action, attr: attr ? 'sorites' : '-' }));
}
