// 轮 201 诊断2：reward_function_edit 两条漏判句逐支打点（带窗口细节）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const rh = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-zh.js');
const pats = rh.REWARD_HACKING_ZH.reward_function_edit;
const miss = [POOL.reward_function_edit.atk[3], POOL.reward_function_edit.atk[4]];
for (const t of miss) {
  console.log(`\n句: ${t}`);
  pats.forEach((p, i) => {
    const m = t.match(p);
    console.log(`  支${i}: ${m ? 'HIT ' + JSON.stringify(m[0].slice(0, 40)) : '-'}`);
  });
}
console.log('\nbenign 侧：');
for (const t of POOL.reward_function_edit.ben) {
  console.log(`  ${t}  -> ${pats.some(p => p.test(t)) ? 'HIT!!' : 'pass'}`);
}
// 逐个良性句子测不同来源是否误伤（bene 字串内可能有多个 sentence；只整句匹配）
