// 调试 gate.check 返回结构
'use strict';
const gate = require('/data/home/heartflow/src/gate.js');
const samples = [
  '一个真正称职的领导，怎么会让团队散架',
  'GDP 增速上去了，说明经济真的更健康了',
  '就多吃了一块蛋糕，怎么可能影响减肥大计',
  '要么现在改方案要么下季度返工，你选了现在改，那我们明天启动',
];
for (const s of samples) {
  const g = gate.check(s);
  console.log('TEXT:', s.slice(0, 30));
  console.log('  top keys:', Object.keys(g).join(','));
  console.log('  action:', g.action, '| gate.action:', g.gate && g.gate.action);
  console.log('  findings:', JSON.stringify((g.findings || []).map(f => ({ d: f.dimension, sev: f.severity }))));
  console.log('  verdict:', g.verdict);
}
