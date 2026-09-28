// 轮 201 诊断：reward_function_edit 最后两条漏判句，逐支打点看哪一支该命中。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const rh = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-zh.js');
const pats = rh.REWARD_HACKING_ZH.reward_function_edit;
for (const t of POOL.reward_function_edit.atk) {
  console.log(`\n句: ${t}`);
  pats.forEach((p, i) => {
    const m = t.match(p);
    console.log(`  支${i}: ${m ? 'HIT ' + JSON.stringify(m[0].slice(0, 40)) : '-'}`);
  });
}
