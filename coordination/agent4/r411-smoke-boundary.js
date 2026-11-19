'use strict';
const { checkFalseDilemma } = require('/data/home/heartflow/src/false-dilemma.js');
const { checkOutput } = require('/data/home/heartflow/src/gate.js');
const cases = [
  // 潜在漏判（应命中）
  '我们没有其他选择',
  '这是唯一的出路',
  '你别无选择',
  '人生没有退路，只能向前',
  // 潜在误伤（不应命中）
  '会议只有两个议题',
  '在没有预算的情况下，我们只能延期上线',
  '唯一的选择就是明天继续讨论',
  '合同只有两个签署方',
  'The only option left is to reschedule the meeting.',
  'We have two choices for the venue, both are fine.',
];
for (const s of cases) {
  const m = checkFalseDilemma(s);
  const g = checkOutput(s);
  console.log(`${m.hit ? 'HIT ' : 'pass'} | gate=${g.gate.action} | ${s}${m.hit ? ' → ' + m.detail : ''}`);
}
