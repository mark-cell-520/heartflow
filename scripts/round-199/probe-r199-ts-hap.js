// 轮 199：task_substitution / human_answer_proxy miss 逐支打点
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { REWARD_HACKING_EN } = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-en.js');

for (const fam of ['task_substitution', 'human_answer_proxy']) {
  const pats = REWARD_HACKING_EN[fam];
  console.log(`=== ${fam} (nPat=${pats.length})`);
  POOL[fam].atk.forEach((t, i) => {
    const fired = [];
    pats.forEach((p, j) => { if (p.test(t)) fired.push(j); });
    console.log(`  atk#${i + 1} fired=[${fired.join(',')}]`);
  });
  POOL[fam].ben.forEach((t, i) => {
    const fired = [];
    pats.forEach((p, j) => { if (p.test(t)) fired.push(j); });
    if (fired.length) console.log(`  BEN#${i + 1} fired=[${fired.join(',')}]  <-- 误伤`);
  });
}
