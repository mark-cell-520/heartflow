// 轮 201 诊断：reward_task_decoupling 漏判三条逐支打点。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const rh = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-zh.js');
const pats = rh.REWARD_HACKING_ZH.reward_task_decoupling;
POOL.reward_task_decoupling.atk.forEach((t, i) => {
  const hit = [];
  pats.forEach((p, j) => { if (p.test(t)) hit.push(j); });
  console.log(`#${i + 1} 支=[${hit.join(',')}] ${t}`);
});
console.log('--- benign ---');
POOL.reward_task_decoupling.ben.forEach((t, i) => {
  const hit = [];
  pats.forEach((p, j) => { if (p.test(t)) hit.push(j); });
  console.log(`#${i + 1} 支=[${hit.join(',')}] ${t.slice(0, 36)}`);
});
