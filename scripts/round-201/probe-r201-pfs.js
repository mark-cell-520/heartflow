// 轮 201 诊断：protected_fd_swap 漏判三条逐支打点。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const rh = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-zh.js');
const pats = rh.REWARD_HACKING_ZH.protected_fd_swap;
POOL.protected_fd_swap.atk.forEach((t, i) => {
  const hit = [];
  pats.forEach((p, j) => { if (p.test(t)) hit.push(j); });
  console.log(`#${i + 1} 支=[${hit.join(',')}] ${t}`);
});
console.log('--- benign ---');
POOL.protected_fd_swap.ben.forEach((t, i) => {
  const hit = [];
  pats.forEach((p, j) => { if (p.test(t)) hit.push(j); });
  console.log(`#${i + 1} 支=[${hit.join(',')}] ${t.slice(0, 32)}`);
});
