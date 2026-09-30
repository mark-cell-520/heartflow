// 轮 199：EIS 剩余 miss 逐支打点（miss 2/3/5 各配哪个来源半）
// 只输出支号与命中与否，不贴样本原文
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { REWARD_HACKING_EN } = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-en.js');

const fam = 'eval_input_shortcut';
const pats = REWARD_HACKING_EN[fam];
POOL[fam].atk.forEach((t, i) => {
  const fired = [];
  pats.forEach((p, j) => { if (p.test(t)) fired.push(j); });
  console.log(`atk#${i + 1}\tfired=[${fired.join(',')}]\tnPat=${pats.length}`);
});
