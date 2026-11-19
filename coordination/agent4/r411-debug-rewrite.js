'use strict';
const { checkOutput } = require('/data/home/heartflow/src/gate.js');
const cases = [
  '这是唯一的出路',
  '唯一的选择就是明天继续讨论',
  'The only option left is to reschedule the meeting.',
];
for (const s of cases) {
  const g = checkOutput(s);
  console.log(JSON.stringify(s), '→', g.gate.action);
  for (const f of g.findings || []) console.log('   ', f.dimension, f.severity, (f.details || '').slice(0, 60));
}
