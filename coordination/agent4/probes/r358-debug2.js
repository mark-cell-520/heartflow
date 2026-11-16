'use strict';
const { checkRedHerring } = require('/data/home/heartflow/src/red-herring.js');
const { gate } = require('/data/home/heartflow/src/gate.js');

// 候选 EN 良性：模块层应放过 + gate 层应 pass（不触发 future_faking 等他维度）
const CANDIDATES = [
  'It is too early to discuss the results; let us first finish the data review.',
  'It is too early to address the bug reports; let us first complete the regression suite.',
  'It is too early to discuss the layoffs; the migration is not done yet.',
  'This is not the time to review the contract, the draft is not ready.',
  'It is too early to discuss the results, the audit is not complete.',
];
for (const t of CANDIDATES) {
  const m = checkRedHerring(t);
  const g = gate(t);
  console.log(`module=${m.hit ? 'HIT' : 'ok '} gate=${g.gate.action} ${(g.findings || []).map(f => f.dimension).join(',')} :: ${t}`);
}

// 资格门精度证明：permissive priority（模拟拆墙）后无优先标记良性应翻转
const R = require('/data/home/heartflow/src/red-herring.js').__internals();
console.log('defer markers:', R.MARKERS.filter(m => m.kind === 'defer').length);
for (const t of [
  '现在不是讨论技术细节的时候，我们先看整体架构。',
  '这个问题现在讨论还太早，我们先聊聊背景。',
]) {
  const wallsOff = checkRedHerring(t, { REPLACE_PRIORITY_ZH: [/./], REPLACE_PRIORITY_EN: [/./] });
  console.log(`wallsOff=${wallsOff.hit ? 'HIT' : 'ok '} :: ${t}`);
  const emptyP = checkRedHerring(t, { REPLACE_PRIORITY_ZH: [], REPLACE_PRIORITY_EN: [] });
  console.log(`emptyP=${emptyP.hit ? 'HIT' : 'ok '} :: ${t}`);
}
