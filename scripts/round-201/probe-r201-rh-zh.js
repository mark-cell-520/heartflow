// 轮 201：rh 中文侧稀疏族收割的最新基线（9 个族 zh<=5）。
// 双口径：regex 命中数 vs 引擎 class 归因（与轮 199 探针同构）。
// 只输出数字，不贴样本。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { checkRewardHacking } = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-zh.js');

let totalAtk = 0, hitAtk = 0, totalBen = 0, benHit = 0;
const rows = [];
for (const [fam, p] of Object.entries(POOL)) {
  let hit = 0, bHit = 0;
  const missIdx = [];
  p.atk.forEach((t, i) => {
    const r = checkRewardHacking(t);
    if (r.count > 0 && r.classes.includes(fam)) hit++;
    else missIdx.push(i + 1);
  });
  p.ben.forEach((t) => {
    const r = checkRewardHacking(t);
    if (r.count > 0 && r.classes.includes(fam)) bHit++;
  });
  totalAtk += p.atk.length; hitAtk += hit;
  totalBen += p.ben.length; benHit += bHit;
  rows.push({ fam, hit, n: p.atk.length, missIdx, bHit, bn: p.ben.length });
}
rows.sort((a, b) => (a.hit / a.n) - (b.hit / b.n));
for (const r of rows) {
  const gap = r.hit === r.n ? 'SATURATED' : (r.hit === 0 ? 'EMPTY' : 'PARTIAL');
  console.log(`${gap}\t${r.fam}\tatk=${r.hit}/${r.n}\tmiss=[${r.missIdx.join(',')}]\tbenignFamHit=${r.bHit}/${r.bn}`);
}
console.log(`TOTAL\tatk=${hitAtk}/${totalAtk}\tbenign=${benHit}/${totalBen}`);
