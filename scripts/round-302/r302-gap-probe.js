'use strict';
// r302 缺口探针：regression_to_the_mean（第 193 维度）现有判据覆盖审计
// 目的：动手前实证「极端值选取后的自然回落被归因于干预」这一核心谬误的
//   哪些措辞家族在现有判据下真零命中（gate.action=pass 且维度零承重）。
// 用法：/root/.local/bin/node scripts/round-302/r302-gap-probe.js
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const gateModule = require(path.join(ROOT, 'src/gate.js'));
const gate = typeof gateModule === 'function' ? gateModule : gateModule.gate;

// 候选族（每条都是「选了极端值 → 事后回归 → 归因于干预」的同一个统计错误）
const ATTACKS = [
  // A. 经典「极端值选取 + 事后回落 + 归因干预」（应命中）
  ['A1 ZH 经典', '上次考试他考了第一，这次考差了，说明上次的补课班起了反作用。'],
  ['A2 EN 经典', 'The stock hit an all-time high last quarter and fell this quarter, proving the buyback backfired.'],
  ['A3 ZH 回落', '他这个月业绩是冠军，上个月只是普通水平，所以那个激励政策根本没用。'],
  // B. 「因为好所以之后变差 = 干预有效/有害」——反向归因
  ['B1 ZH 反向', '她第一年绩效最好，之后逐年下降，说明当初的升职提拔是个错误。'],
  ['B2 EN 反向', 'The rookie had a stellar first year and then declined, which shows the draft pick was a mistake.'],
  // C. 「因为差所以之后变好 = 干预有效」
  ['C1 ZH 正向', '他最差的时候我们引进了新教练，之后成绩回升，证明新教练很有效。'],
  ['C2 EN 正向', 'They were at the bottom of the table when we changed the manager, and then they improved, so the change worked.'],
  // D. 医学/ placebo 族（HN 论文方向）
  ['D1 ZH 医学', '病人疼得最厉害的时候吃了这个药，后来不疼了，所以这药有效。'],
  ['D2 EN 医学', 'Her pain was at its worst when she took the remedy and it eased afterwards, so the remedy works.'],
  // E. 无显式干预名词的纯统计观察族
  ['E1 ZH 纯观察', '这些公司去年业绩最好，今年普遍下滑，所以去年的好势头不可持续。'],
  ['E2 EN 纯观察', 'The students who scored highest in September scored lower in June, so early testing is unreliable.'],
  // F. 「预期回归」框架族
  ['F1 ZH 预期', '再招一批新人来，第一年往往表现最好，之后都会回落，这是正常现象。'],
  // G. 良性对照（应 pass）
  ['G1 ZH 良性', '他上次考第一有运气成分，这次成绩回落属于均值回归，不能说明补课班有害。'],
  ['G2 EN 良性', 'A single peak score is not evidence that the tutoring worked; regression to the mean explains it.'],
  ['G3 ZH 良性2', '业绩冠军下一年下滑是统计上的常见现象，与激励政策无关。'],
  ['G4 ZH 良性3', '新教练接手后球队成绩提升，但样本太少，还需要看完整赛季。'],
];

let passA = 0, hitA = 0, passG = 0;
const rows = [];
for (const [label, text] of ATTACKS) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension);
  const rtHit = dims.includes('regression_to_the_mean');
  const isAtk = /^[A-F]/.test(label);
  if (isAtk) { if (r.gate.action === 'pass') passA++; if (rtHit) hitA++; }
  else { if (r.gate.action === 'pass') passG++; }
  rows.push(`${isAtk ? 'ATK' : 'BEN'} ${label.padEnd(14)} action=${String(r.gate.action).padEnd(7)} rt=${rtHit ? 'Y' : '-'} dims=[${dims.slice(0,4).join(',')}]`);
}
console.log(rows.join('\n'));
console.log(`\n攻击穿透(action=pass): ${passA}/14   其中 rt 维度命中: ${hitA}/14`);
console.log(`良性 pass: ${passG}/4`);
