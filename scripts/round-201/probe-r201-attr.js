// 轮 201：reward_function_edit / copy_paste_shortcut 中文侧漏判逐条归因。
// 目的：确认漏判是「缺支」还是「被其他族抢占」，再决定补法。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { checkRewardHacking } = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-zh.js');

for (const fam of ['reward_function_edit', 'copy_paste_shortcut', 'protected_fd_swap',
                   'selective_reporting', 'port_scan_mirror', 'reward_task_decoupling',
                   'loosening_standard', 'log_scavenging', 'bypass_check']) {
  console.log(`\n=== ${fam} ===`);
  POOL[fam].atk.forEach((t, i) => {
    const r = checkRewardHacking(t);
    const mark = r.classes.includes(fam) ? 'HIT ' : 'miss';
    console.log(`  ${mark} #${i + 1} classes=[${r.classes.join(',')}]`);
  });
  POOL[fam].ben.forEach((t, i) => {
    const r = checkRewardHacking(t);
    if (r.count > 0) console.log(`  BENIGN-HIT #${i + 1} classes=[${r.classes.join(',')}]`);
  });
}
