// 轮 201 诊断：loosening_standard 漏判两条逐支打点。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const rh = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-zh.js');
const pats = rh.REWARD_HACKING_ZH.loosening_standard;
POOL.loosening_standard.atk.forEach((t, i) => {
  const hit = [];
  pats.forEach((p, j) => { if (p.test(t)) hit.push(j); });
  console.log(`#${i + 1} 支=[${hit.join(',')}] ${t}`);
});
console.log('--- benign ---');
POOL.loosening_standard.ben.forEach((t, i) => {
  const hit = [];
  pats.forEach((p, j) => { if (p.test(t)) hit.push(j); });
  console.log(`#${i + 1} 支=[${hit.join(',')}] ${t.slice(0, 36)}`);
});
