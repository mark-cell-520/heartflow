// r629: 用 decision 本体从候选池选一个方向（替代脑内模拟）
const { HeartFlowDecision } = require('../src/core/decision.js');
const fs = require('fs');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = fs.readFileSync('/tmp/r629-candidates.txt', 'utf8');
  const res = await d.decide({ task: '选下一轮方向', prompt });
  console.log('DECISION' + JSON.stringify(res, null, 1));
  process.exit(0);
})().catch(e => { console.log('FATAL ' + e.message); process.exit(1); });
