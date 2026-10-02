// r384 探针 5：英文侧 T1 同构误抓实测（A 组完整陈述 vs B 组真过渡语）
'use strict';
const pt = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/premature-termination.js');

const A_EN = [
  'Just try it this once, then it will feel more natural over time',
  'Start with the first step and it becomes second nature later',
  'Do this small thing first, after that you will get used to it',
];
const B_EN = [
  'Let me check',
  'I will look into this',
  "I'll analyze it",
];

for (const [name, group] of [['A_en_complete', A_EN], ['B_en_status', B_EN]]) {
  const rows = group.map(s => ({ s: s.slice(0, 40), t1: pt.checkPrematureTermination(s).signals.some(x => x.id === 'T1_status_utterance'), t2: pt.checkPrematureTermination(s).signals.some(x => x.id === 'T2_too_short') }));
  console.log(name + ' T1命中=' + rows.filter(r => r.t1).length + '/' + rows.length + ' T2命中=' + rows.filter(r => r.t2).length + '/' + rows.length);
  for (const r of rows) console.log('   ' + (r.t1 ? 'T1-HIT ' : 'T1-miss') + (r.t2 ? ' T2-HIT' : ' T2-miss') + ' ' + r.s);
}
