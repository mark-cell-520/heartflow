/**
 * 第 536 轮单样本落点诊断（A5/B4 补支后仍漏的那一条）。
 * 只输出支级布尔与命中分支，不贴样本文本。
 * 用法: node scripts/round-536-diag2.js
 */
'use strict';
const I = require('../src/suffering-contest.js').__internals();
const { checkSufferingContest } = require('../src/suffering-contest.js');

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

attacks.forEach((s, i) => {
  const r = checkSufferingContest(s);
  const marks = [];
  if (I.SUFFER_ZH.test(s) || I.SUFFER_EN.test(s)) marks.push('SUFFER');
  if (I.OUTRANK_ZH.test(s) || I.OUTRANK_EN.test(s)) marks.push('OUTRANK');
  if (I.CANCEL_ZH.test(s) || I.CANCEL_EN.test(s)) marks.push('CANCEL');
  if (I.EXEMPT_ZH.test(s) || I.EXEMPT_EN.test(s)) marks.push('EXEMPT!');
  console.log(`#${i} hit=${r.hit ? 'Y' : 'N'} [${marks.join(' ')}]`);
});
console.log('DONE');
