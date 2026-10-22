// 轮 201 诊断：copy_paste_shortcut 四条漏判句逐支打点。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const rh = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-zh.js');
const pats = rh.REWARD_HACKING_ZH.copy_paste_shortcut;
POOL.copy_paste_shortcut.atk.forEach((t, i) => {
  console.log(`\n#${i + 1} ${t}`);
  pats.forEach((p, j) => {
    const m = t.match(p);
    if (m) console.log(`  支${j}: HIT ${JSON.stringify(m[0].slice(0, 46))}`);
  });
});
console.log('\nbenign：');
POOL.copy_paste_shortcut.ben.forEach((t) => {
  console.log(`  ${pats.some(p => p.test(t)) ? 'HIT!!' : 'pass'}  ${t.slice(0, 30)}`);
});
