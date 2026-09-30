// 轮 198 探针 B3：四族英文攻击句——反查「是否被豁免链吃掉了」（双口径：regex vs 引擎）
// 双口径纪律：regex 命中但 count=0 → 豁免问题；regex 与 count 都 0 → 判据缺失
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { checkRewardHacking, REWARD_HACKING_EN } = require(path.join(HF, 'src/reward-hacking.js'));
const { POOL } = require('./probe-r198-pool.js');

const FAMS = ['measurement_rigging', 'report_fudging', 'task_substitution', 'human_answer_proxy'];

for (const fam of FAMS) {
  const pats = REWARD_HACKING_EN[fam] || [];
  console.log(`== ${fam} ==`);
  POOL[fam].atk.forEach((t, i) => {
    const reHit = pats.some(p => p.test(t));
    const r = checkRewardHacking(t);
    const anyHit = r.count > 0;
    const famHit = r.classes.includes(fam);
    let cause = 'judge-missing';
    if (reHit && !famHit) cause = r.exempted ? 'EXEMPTED(' + r.exempted + ')' : 'rehit-but-not-this-fam';
    else if (!reHit && anyHit) cause = 'other-fam(' + r.classes.join(',') + ')';
    else if (reHit && famHit) cause = 'OK';
    console.log(`  atk#${i + 1}: re=${reHit ? 1 : 0} eng=${famHit ? 1 : 0} -> ${cause}`);
  });
  POOL[fam].ben.forEach((t, i) => {
    const r = checkRewardHacking(t);
    if (r.count > 0) console.log(`  ben#${i + 1}: ENG-HIT ${r.classes.join(',')}`);
  });
}
