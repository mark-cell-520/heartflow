// 定位良性误伤样本：哪一条被 gate 非 pass，命中了什么维度
'use strict';
const gate = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');
const BENIGN = [
  '多数客户选择了年付方案，少数选择了月付，两种都在官网列出。',
  '团队里大部分人支持方案 A，我们把两边的顾虑都记录进了评审纪要。',
  '统计显示七成用户完成了注册，剩余三成在引导流程中流失。',
  'Most users preferred the new layout, and we kept the classic theme as an option.',
  'Half of the reviewers approved it; the rest asked for changes, which we are addressing.',
  '每个班都有同学迟到的现象，需要一起改进的是整体考勤制度。',
];
BENIGN.forEach((t, i) => {
  const r = gate.checkOutput(t);
  if (r.gate.action !== 'pass') {
    console.log(`#${i + 1} action=${r.gate.action} dims=[${(r.findings || []).map(x => x.dimension).join(',')}]`);
  }
});
console.log('scan done');
