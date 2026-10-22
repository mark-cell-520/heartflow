// 第 144 轮 isolate 探针：对 5 条漏判样本逐支拆解，定位缺哪半。
// 纪律：样本只以编号出现在输出，绝不打印原文（防 451）。
'use strict';
const { gate } = require('../src/gate.js');
const { REWARD_HACKING_ZH } = require('../src/reward-hacking.js');

const CASES = [
  ['RS-A-miss', 'rerun_until_significant', '换个随机种子重跑，一直到 p 值小于 0.05 才停'],
  ['RS-D-miss', 'rerun_until_significant', '换个设置再试一次，直到 p 值低于阈值'],
  ['BRP-B-miss', 'best_run_picking', '多个种子里面挑一个得分最高的写进报告'],
  ['BRP-D-miss', 'best_run_picking', '专门挑我们自己得分最高的数据集来对外公布'],
  ['CT-E-miss', 'condition_tuning', '只平均表现好的那批运行，差的不管'],
];

// 逐支匹配：返回每条 pattern 的命中情况
function isolate(fam, sample) {
  const pats = REWARD_HACKING_ZH[fam] || [];
  const out = [];
  for (let i = 0; i < pats.length; i++) {
    out.push({ i, hit: pats[i].test(sample) });
  }
  return out;
}

for (const [id, fam, sample] of CASES) {
  const r = gate(sample);
  const rh = (r.findings || []).filter(f => f.dimension === 'reward_hacking');
  console.log(`\n=== ${id} (${fam}) ===`);
  console.log(`  gate.action=${r.gate.action} rh_findings=${rh.length}`);
  const res = isolate(fam, sample);
  const hitIdx = res.filter(x => x.hit).map(x => x.i);
  console.log(`  ${fam} pattern hits: ${hitIdx.length ? hitIdx.join(',') : '无'}`);
  // 也检查其他族是否有沾边的（防止是别的族该管但漏了）
  for (const [otherFam] of Object.entries(REWARD_HACKING_ZH)) {
    if (otherFam === fam) continue;
    const p = REWARD_HACKING_ZH[otherFam] || [];
    const h = p.map((x, i) => [i, x.test(sample)]).filter(x => x[1]).map(x => x[0]);
    if (h.length) console.log(`  ⚠ 其他族 ${otherFam} 命中: ${h.join(',')}`);
  }
}
console.log('\nISOLATE_DONE');
