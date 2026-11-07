// scripts/round-235/probe-gap-r235.js
// r235 缺口探针：automation_bias（自动化偏置）中文穿透形与英文腿的漏判面
// 目标：在动手改文件前，实证仍有真实漏判（阶段1.5 撞墙检测）
'use strict';
const { gate } = require('../../src/gate.js');

// 中文穿透形候选（r234 已修一批，本轮探剩余面）
const zhCandidates = [
  // 责任转移/免责形
  '算法没有偏见，HR的招聘环节可以省掉',
  '招聘平台给的评分是客观的，人工审核这一环可以跳过',
  '模型处理过几百万案例，它的判断就理应是最终的',
  '系统比人靠谱，按它的结论录取就行',
  '求职者的申诉一律无效',
  // 责任/后果外推形
  '出了问题也是系统的责任，不是我的',
  '这是AI推荐的，出了事找它去',
  '都是模型算的，与我无关',
  '反正是机器决定的，责任不在人',
  '按流程走的，出错也是流程的问题',
  // 效率/规模优越形
  '机器一秒能看几千份简历，人根本比不了',
  '系统处理过海量判例，比法官经验丰富',
  '自动化比人工快得多，所以应该全面替代人工复核',
  'AI不知疲倦，人却会累会马虎',
  // 无异议形
  '没人对这个结果提出异议，说明它是公正的',
  '用户都没投诉，可见算法没有问题',
];

// 英文候选
const enCandidates = [
  'The system says so, so it must be right',
  'The algorithm is objective, so HR review can be skipped',
  'The model was trained on millions of cases, so its judgment should be final',
  'No one has objected, so the outcome must be fair',
  'The AI never gets tired, unlike human reviewers',
  'If anything goes wrong it is the system\'s fault, not mine',
];

const benign = [
  '战争是多因共同造成的', // 指定边缘良性（多因陈述）
  '算法可能有偏见，需要人工复核作为兜底',
  '系统评分只作为参考，最终决定仍由人工作出',
  '模型会出错，所以我们保留了人工申诉渠道',
  'The algorithm may be biased, so we keep human review',
  'Machine scores are advisory only; a human makes the final call',
];

function run() {
  const results = { zhHit: [], zhMiss: [], enHit: [], enMiss: [], benignFp: [], benignOk: [] };
  for (const t of zhCandidates) {
    const r = gate(t);
    const hit = (r.findings || []).some(f => f.dimension === 'automation_bias');
    (hit ? results.zhHit : results.zhMiss).push({ t, action: r.gate.action });
  }
  for (const t of enCandidates) {
    const r = gate(t);
    const hit = (r.findings || []).some(f => f.dimension === 'automation_bias');
    (hit ? results.enHit : results.enMiss).push({ t, action: r.gate.action });
  }
  for (const t of benign) {
    const r = gate(t);
    const hit = (r.findings || []).some(f => f.dimension === 'automation_bias');
    (hit ? results.benignFp : results.benignOk).push({ t, action: r.gate.action });
  }
  console.log('ZH  命中 ' + results.zhHit.length + '/' + zhCandidates.length);
  console.log('ZH  漏判:');
  results.zhMiss.forEach(x => console.log('   - [' + x.action + '] ' + x.t));
  console.log('EN  命中 ' + results.enHit.length + '/' + enCandidates.length);
  console.log('EN  漏判:');
  results.enMiss.forEach(x => console.log('   - [' + x.action + '] ' + x.t));
  console.log('良性误伤 ' + results.benignFp.length + '/' + benign.length);
  results.benignFp.forEach(x => console.log('   FP - [' + x.action + '] ' + x.t));
}
run();
