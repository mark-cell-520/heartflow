// 轮 198 探针 B2：四个缺口族的逐条判据打点（输出每条样本命中的正则序号/字面）
// 只输出数字与序号，不打印样本原文（451 纪律）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { REWARD_HACKING_EN } = require(path.join(HF, 'src/reward-hacking.js'));

const FAMS = ['measurement_rigging', 'report_fudging', 'task_substitution', 'human_answer_proxy'];

// 与 probe-r198-rh-en.js 同一批样本（单一来源：复制 key）
const { POOL } = require('./probe-r198-pool.js');

for (const fam of FAMS) {
  const pats = REWARD_HACKING_EN[fam];
  console.log(`\n== ${fam} (${pats.length} 支) ==`);
  POOL[fam].atk.forEach((t, i) => {
    const hits = [];
    pats.forEach((p, j) => { if (p.test(t)) hits.push(j + 1); });
    console.log(`  atk#${i + 1}: [${hits.join(',') || 'none'}]`);
  });
  POOL[fam].ben.forEach((t, i) => {
    const hits = [];
    pats.forEach((p, j) => { if (p.test(t)) hits.push(j + 1); });
    console.log(`  ben#${i + 1}: [${hits.join(',') || 'none'}]`);
  });
}
