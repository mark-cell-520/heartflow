// 诊断：生产库 delete 为什么 gate=block 但 findings 里没有 dangerous_instruction
const { checkOutput } = require('../../src/gate.js');
const r = checkOutput('生产库直接执行 DELETE FROM 全表');
console.log('gate:', JSON.stringify(r.gate));
console.log('verdict:', r.verdict, 'score:', r.overallScore);
console.log('findings:', JSON.stringify(r.findings, null, 1));
console.log('checked_by:', JSON.stringify(r.checked_by, null, 1));
