// r359 probe-15：P2 置假点的独立失效面样本定位
// r358 的 P2 soloSamples 用的是群体差异句，实测被三处 isGroupFactDiffEn
// 豁免链吸收 → 置假后仍 pass（GREEN）。probe-14 已坐实 S1_false_precision
// 是该形状的真实触发支（old 命中 / fixed 不命中），所以失效面真实存在，
// 只是样本选错——必须同时避开：① isGroupFactDiffEn（无差异动词/群体量词）
// ② SOURCED_CONTEXT（无 survey/report/study/research/census/audit）
'use strict';
const path = require('path');
const { gate } = require(path.join(__dirname, '..', '..', 'src/gate.js'));

// 候选：含「数字 + percentage point」但不是群体事实差异句、无来源词
const CANDIDATES = [
  'The deviation exceeds 3 percentage point beyond the agreed tolerance.',
  'A 2 percentage point shift in the index was recorded during the quarter.',
  'The tolerance is 5 percentage point on this instrument reading.',
  'Overshoot reached 4 percentage point under heavy load.',
  'Drift of 1.5 percentage point per hour is expected at this temperature.',
  'The tolerance margin shrinks to 2 percentage point when cold.',
];
for (const t of CANDIDATES) {
  const r = gate(t);
  const f = r.findings.map((x) => x.dimension).join(',');
  console.log(`action=${r.gate.action} [${f}] ${JSON.stringify(t.slice(0, 45))}`);
}
