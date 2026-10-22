// 轮 198 探针 B5：hap atk#1（无冒充半的取答案句）——检查是「形状真缺」还是「两半不齐」
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { checkRewardHacking, REWARD_HACKING_EN } = require(path.join(HF, 'src/reward-hacking.js'));
const { POOL } = require('./probe-r198-pool.js');

const t = POOL.human_answer_proxy.atk[0];
console.log('sample len=' + t.length);
const pats = REWARD_HACKING_EN.human_answer_proxy;
pats.forEach((p, i) => {
  const m = t.match(p);
  console.log(`#${i + 1}: ${m ? 'HIT "' + m[0].slice(0, 60) + '"' : 'miss'}`);
});
const r = checkRewardHacking(t);
console.log('engine classes=' + JSON.stringify(r.classes) + ' exempted=' + r.exempted);
