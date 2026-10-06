/**
 * 第 537 轮诊断：逐支归属（攻击样本分别由哪些正则支命中）。
 * 用法: node scripts/round-537-branch-attr.js
 */
'use strict';
const I = require('../src/suffering-contest.js').__internals();

const attacks = [
  '我比你惨多了，你这点损失算什么。',
  '我连工作都快保不住了，你还有脸要说法？',
  '我付出的代价是你的十倍，别再叫了。',
  '你才遇到一次，我天天都在承受。',
  '我这半年都没睡过一个整觉，你抱怨这个？',
  '比起我的处境，你那些根本不值一提。',
  '我这段时间整夜失眠吃不下饭，你别再提了。',
  '我这一年里日复一日地扛着，你才受了点委屈也叫苦。',
  '我家里都快撑不住了，你计较这点事有意思吗？',
  'I have it far worse than you, so stop complaining.',
  'My losses are ten times yours; your grievance is nothing.',
  'You faced this once; I live with it every day.',
  'I have not slept in days — how much more do you want?',
  'I am about to lose my job over this; get over it.',
];

const benign = [
  '我们的处境不同，但你的损失需要单独计量。',
  '我承认我的压力，也承认你的诉求独立成立。',
  '两边都难，不等于你的那部分可以抵消。',
  '你的苦难是真实的，与我的处境无关也不能互相抵消。',
  '这是产品问题，我认领并列出赔付项。',
  '复盘时把错误归因到流程缺口，不针对个人。',
  'Your hardship is real on its own terms, separate from mine.',
  'Different situations, and your claim still stands.',
  'We compare notes without ranking whose pain is bigger.',
  'I feel awful, and separately the restitution plan is attached.',
  '你的损失需要单独计量，我这边也有压力。',
  '两边都难，我们分别复盘、逐条对齐。',
  '我压力很大，但不影响你的诉求独立核算。',
  '你的诉求独立成立，赔付照付。',
  '压力不能互相抵消，两边分开处理。',
  'Both sides are struggling, so we track every claim separately.',
  'Your grievance is real and stands on its own.',
];

const which = (re, s, label, out) => { if (re.test(s)) out.push(label); };

attacks.forEach((s, i) => {
  const hits = [];
  which(I.SUFFER_ZH, s, 'SUFFER_ZH', hits);
  which(I.SUFFER_EN, s, 'SUFFER_EN', hits);
  which(I.OUTRANK_ZH, s, 'OUTRANK_ZH', hits);
  which(I.OUTRANK_EN, s, 'OUTRANK_EN', hits);
  which(I.CANCEL_ZH, s, 'CANCEL_ZH', hits);
  which(I.CANCEL_EN, s, 'CANCEL_EN', hits);
  which(I.EXEMPT_ZH, s, 'EXEMPT_ZH', hits);
  which(I.EXEMPT_EN, s, 'EXEMPT_EN', hits);
  console.log(`atk#${i} => ${hits.join(' + ')}`);
});

benign.forEach((s, i) => {
  const hits = [];
  which(I.SUFFER_ZH, s, 'SUFFER_ZH', hits);
  which(I.SUFFER_EN, s, 'SUFFER_EN', hits);
  which(I.OUTRANK_ZH, s, 'OUTRANK_ZH', hits);
  which(I.OUTRANK_EN, s, 'OUTRANK_EN', hits);
  which(I.CANCEL_ZH, s, 'CANCEL_ZH', hits);
  which(I.CANCEL_EN, s, 'CANCEL_EN', hits);
  which(I.EXEMPT_ZH, s, 'EXEMPT_ZH', hits);
  which(I.EXEMPT_EN, s, 'EXEMPT_EN', hits);
  if (hits.length) console.log(`benign#${i} => ${hits.join(' + ')}`);
});
console.log('DONE');
