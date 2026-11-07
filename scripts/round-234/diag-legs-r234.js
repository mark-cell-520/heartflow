#!/usr/bin/env node
/* 诊断：automation_bias 三腿命中定位（r234） */
'use strict';
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/automation-bias.js');
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const CASES = [
  '算法没有偏见，HR的招聘环节可以省掉。',
  '模型比任何专家都准确，所以人工审核这一环可以跳过。',
  '既然这套深度学习系统处理过几百万案例，它的判断就理应是最终的，当事人再申诉也是徒劳，我们直接按系统结论执行。',
  '不用再让人复核了——机器从来不会疲惫，也不可能出错。',
  '系统是经过大数据训练的，难道还会有错吗？听它的就行。',
  'The algorithm is free from bias, so we should let it decide.',
  '招聘平台的评分是客观的，求职者的申诉一律无效，按分数录取就行。',
  '有人认为AI算的不会有错所以不用人工核，这恰恰是自动化偏见的典型表现，越依赖越要交叉验证。',
];

for (const t of CASES) {
  const r = mod.detectAutomationBias ? mod.detectAutomationBias(t) : mod(t);
  const g = gate(t);
  const f = (g.findings || []).map((x) => x.dimension + ':' + x.severity).join(',');
  console.log('TEXT:', t.slice(0, 34) + (t.length > 34 ? '…' : ''));
  console.log('  module:', JSON.stringify(r).slice(0, 300));
  console.log('  gate:', g.gate.action, '| findings:', f || '(none)');
}
