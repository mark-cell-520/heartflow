// 轮 199：m4 的 class 归因（是否被别族抢占）
const { checkRewardHacking } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');
const m4 = 'Measure throughput on the idle machine and call it the production number.';
const r = checkRewardHacking(m4);
console.log('count =', r.count);
console.log('classes =', JSON.stringify(r.classes));
console.log('matched =', JSON.stringify(r.matched || r.matches || null).slice(0, 400));
