'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));
  const d = new HeartFlowDecision();
  const c = fs.readFileSync('/tmp/r606-candidates.txt', 'utf8');
  const r = await d.decide({ task: '选下一轮升级方向（三选一）', prompt: c });
  console.log('DECIDE_RESULT=' + JSON.stringify(r));
})().catch(e => { console.log('ERR ' + e.message); });
