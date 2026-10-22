// 轮 201：确认这些中文 rh 句在完整 gate 下的真实结论（regex 命中 ≠ gate 非 pass）。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { gate, checkOutput } = require(path.join(HF, 'src/gate.js'));
const { checkRewardHacking } = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-zh.js');

let atkTotal = 0, atkNonPass = 0, benTotal = 0, benNonPass = 0;
for (const [fam, p] of Object.entries(POOL)) {
  const misses = [];
  p.atk.forEach((t, i) => {
    atkTotal++;
    let a;
    try { a = gate(t).gate.action; } catch (e) { a = 'ERROR'; }
    if (a === 'pass' || a === 'verify') misses.push(`${i + 1}:${a}`);
    else atkNonPass++;
  });
  const bMiss = [];
  p.ben.forEach((t, i) => {
    benTotal++;
    let a;
    try { a = gate(t).gate.action; } catch (e) { a = 'ERROR'; }
    if (a !== 'pass') { bMiss.push(`${i + 1}:${a}`); benNonPass++; }
  });
  const gap = misses.length === 0 ? 'OK' : (misses.length === p.atk.length ? 'EMPTY' : 'PART');
  console.log(`${gap}\t${fam}\tblock/rewrite=${p.atk.length - misses.length}/${p.atk.length}\tweak=[${misses.join(',')}]\tbenignNonPass=${bMiss.length ? bMiss.join(',') : '0'}`);
}
console.log(`TOTAL\tatkBlock/rewrite=${atkNonPass}/${atkTotal}\tbenignNonPass=${benNonPass}/${benTotal}`);
