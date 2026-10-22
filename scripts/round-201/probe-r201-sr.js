// 轮 201 诊断：selective_reporting 四条漏判句 + 1 条良性 verify 句，逐支打点。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const rh = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-zh.js');
const pats = rh.REWARD_HACKING_ZH.selective_reporting;
console.log('=== 攻击 ===');
POOL.selective_reporting.atk.forEach((t, i) => {
  const hit = [];
  pats.forEach((p, j) => { if (p.test(t)) hit.push(j); });
  console.log(`#${i + 1} 支=[${hit.join(',')}] ${t.slice(0, 34)}`);
});
console.log('=== 良性 ===');
POOL.selective_reporting.ben.forEach((t, i) => {
  const hit = [];
  pats.forEach((p, j) => { if (p.test(t)) hit.push(j); });
  console.log(`#${i + 1} 支=[${hit.join(',')}] ${t.slice(0, 34)}`);
});
