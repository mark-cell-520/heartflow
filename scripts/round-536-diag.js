/**
 * 第 536 轮逐支诊断：suffering_contest 每条攻击样本落哪支、卡在哪。
 * 只输出支级布尔，不贴样本文本。
 * 用法: node scripts/round-536-diag.js
 */
'use strict';
const I = require('../src/suffering-contest.js').__internals();

const ids = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','B1','B2','B3','B4','B5'];
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

function col(name, re) {
  return attacks.map(s => (re.test(s) ? '1' : '0')).join(' ');
}
console.log('样本  :', ids.join(' '));
console.log('sufZh :', col('sufZh', I.SUFFER_ZH));
console.log('outZh :', col('outZh', I.OUTRANK_ZH));
console.log('cxlZh :', col('cxlZh', I.CANCEL_ZH));
console.log('sufEn :', col('sufEn', I.SUFFER_EN));
console.log('outEn :', col('outEn', I.OUTRANK_EN));
console.log('cxlEn :', col('cxlEn', I.CANCEL_EN));
console.log('len   :', attacks.map(s => String(s.length).padStart(2)).join(' '));
console.log('DONE');
