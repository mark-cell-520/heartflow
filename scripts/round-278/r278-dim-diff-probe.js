// 第 278 轮探针：找「归一化破坏导致 gate 层漏判」的真实案例
// 策略：对每个候选维度，构造「原文命中、归一化后不命中」的句子，再确认 gate.action。
// 重点测走 _dual 的维度（双通道应兜住）和不走 _dual 的维度（应漏）。
'use strict';
const path = require('path');
const tn = require('../../src/text-normalizer.js');

// 候选：统计/百分比/倍数类维度对数字 token 敏感
const CASES = [
  // percentage_overflow（百分比溢出）：依赖数字
  { id: 'pct-1', text: 'This upgrade improves performance by 150% and reduces cost by 80%.' },
  { id: 'pct-2', text: 'This upgrade improves performance by 150% on the Q3 build and reduces cost by 80%.' },
  // statistical_misleading
  { id: 'stat-1', text: 'We surveyed 3 people and 2 of them agreed, so 66% support the plan.' },
  { id: 'stat-2', text: 'We surveyed 3 people on 2026-11-10 and 2 agreed, so 66% support the plan.' },
  // percentage_overflow with hash
  { id: 'pct-3', text: 'Fixing bug 3f2a91b improved speed by 120% and cut errors by 90%.' },
];

for (const c of CASES) {
  const r = tn.normalize(c.text);
  const norm = r.normalized !== undefined ? r.normalized : r;
  const applied = (r.applied || []).join(',');
  console.log(`[${c.id}] applied=${applied}`);
  console.log(`  原: ${c.text}`);
  console.log(`  归: ${norm}`);
}
