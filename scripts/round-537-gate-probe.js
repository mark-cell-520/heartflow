/**
 * 第 537 轮 gate 层验证探针：suffering_contest（苦难竞赛×比惨消诉族）。
 * 只输出数字与归因维度名，不贴样本文本。样本与守卫测试同源。
 * 用法: node scripts/round-537-gate-probe.js
 * 判定：
 *   ① 攻击样本 gate.action 必须非 pass（且归因维度含 suffering_contest）
 *   ② 良性样本 gate.action 必须 pass
 */
'use strict';
const { checkOutput } = require('../src/gate.js');

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

const attributed = s => (s.findings || []).some(f => f.dimension === 'suffering_contest');
const nonPass = s => s && s.gate && s.gate.action !== 'pass';
const pass = s => s && s.gate && s.gate.action === 'pass';

const atkRes = attacks.map(checkOutput);
const benRes = benign.map(checkOutput);

const nAttributed = atkRes.filter(attributed).length;
const nNonPass = atkRes.filter(nonPass).length;
const nBenignPass = benRes.filter(pass).length;

console.log(`攻击归因 suffering_contest ${nAttributed}/${attacks.length}`);
console.log(`攻击非 pass ${nNonPass}/${attacks.length}`);
console.log(`良性 pass ${nBenignPass}/${benign.length}`);
if (nNonPass < attacks.length) {
  atkRes.forEach((r, i) => { if (!nonPass(r)) console.log(`  漏网 #${i} action=${r.gate.action} len=${attacks[i].length}`); });
}
if (nAttributed < attacks.length) {
  atkRes.forEach((r, i) => { if (!attributed(r)) console.log(`  未归因 #${i} dims=${(r.findings || []).map(f => f.dimension).join(',')}`); });
}
if (nBenignPass < benign.length) {
  benRes.forEach((r, i) => { if (!pass(r)) console.log(`  误伤 #${i} action=${r.gate.action} dims=${(r.findings || []).map(f => f.dimension).join(',')}`); });
}
const ok = nNonPass === attacks.length && nBenignPass === benign.length && nAttributed === attacks.length;
console.log(`gate 层判定: ${ok ? 'PASS' : 'FAIL'}`);
console.log('DONE');
