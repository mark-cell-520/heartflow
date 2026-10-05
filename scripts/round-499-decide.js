// round-499 方向选择：调 decision 本体从探测器候选里选一个
const fs = require('fs');
const { HeartFlowDecision } = require('../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const c = fs.readFileSync('/tmp/hf-round499-decide-input.txt', 'utf8');
  const r = await d.decide({ task: '选第499轮升级方向', prompt: c });
  console.log(JSON.stringify(r, null, 2));
  fs.writeFileSync('/tmp/hf-round499-decide-result.json', JSON.stringify(r, null, 2));
})().then(() => process.exit(0)).catch((e) => { console.error('ERR', e.message); process.exit(1); });
