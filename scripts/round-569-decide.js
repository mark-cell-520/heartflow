'use strict';
// [r569] 用 decision 本体从探测器候选里选方向（按简报两步走第二步）。
const { HeartFlowDecision } = require('../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const c = require('child_process').execSync('bash /root/.hermes/scripts/heartflow-upgrade-scout.sh').toString();
  console.log('── 探测器原文 ──');
  console.log(c.trim() || '(空)');
  const r = await d.decide({ task: '选下一轮方向', prompt: c });
  console.log('── decision ──');
  console.log(JSON.stringify(r));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
