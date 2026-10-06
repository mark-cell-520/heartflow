'use strict';
/**
 * 第 526 轮补判据探针：交叉归因测度
 *
 * decision 本体对三个候选族两次都返回 chosen:null（并列 0.83-0.84）。
 * 按纪律需要「可区分的客观判据」。这里实测每个族穿过 gate 的攻击样本
 * 中，已有 findings 归因到其他维度的比例——重叠越低，说明该族越是
 * 零覆盖、越值得做成新维度。
 *
 * 只输出数字与维度名，不打印样本原文。
 */
const path = require('node:path');
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));

const src = require('node:fs').readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
// 从探针脚本里原样取出 FAMILIES 定义（不重抄样本，避免原文二次进入上下文）
const m = src.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
if (!m) { console.error('FAIL: 无法从探针脚本提取 FAMILIES'); process.exit(1); }
const FAMILIES = eval('(' + m[1] + ')');

console.log('== r526 交叉归因测度（decision 补判据）==');
for (const [name, fam] of Object.entries(FAMILIES)) {
  let pass = 0, attributed = 0, newDims = 0;
  const dimCounts = {};
  for (const s of fam.attack) {
    const r = gate(s);
    if (r.gate.action !== 'pass') continue;
    pass++;
    const dims = (r.findings || []).map(f => f.dimension);
    const other = dims.filter(d => d !== name);
    if (other.length > 0) attributed++;
    else if (dims.length === 0) newDims++;
    for (const d of other) { dimCounts[d] = (dimCounts[d] || 0) + 1; }
  }
  console.log(`${name}: 穿过 ${pass} 条；其中已有他维归因 ${attributed} 条、findings 完全空 ${newDims} 条`);
  const top = Object.entries(dimCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  console.log(`   接管维度: ${top.map(([d, n]) => `${d}×${n}`).join(', ') || '无'}`);
}
