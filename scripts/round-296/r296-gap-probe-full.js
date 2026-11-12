#!/usr/bin/env node
/**
 * r296 缺口实证探针（完整版）：喂真实攻击样本 + 良性样本
 *   缺口 A: inverse_gamblers_fallacy 英文腿命中情况
 *   缺口 B: ad_hominem 「没资格评论」credential 形态命中情况
 * 数字全部来自本回合真实运行，不猜。
 */
'use strict';
const path = require('path');
const SRC = path.resolve(__dirname, '..', '..', 'src');

function T(file, fn) {
  try { return { ok: true, m: require(path.join(SRC, file))[fn] }; }
  catch (e) { return { ok: false, err: e.message }; }
}

function show(tag, r) {
  const hit = r && r.hit;
  console.log(`  [${hit ? 'HIT ' : 'miss'}] ${tag}${hit ? '  score=' + r.score + ' count=' + r.count : ''}`);
  if (hit && r.evidence) console.log('         evidence: ' + JSON.stringify(r.evidence[0] || r.evidence));
  if (hit && r.details) console.log('         details: ' + String(r.details).slice(0, 120));
  return hit ? 1 : 0;
}

// ═══════════ 缺口 A: inverse_gamblers_fallacy EN ═══════════
console.log('=== 缺口 A: inverse_gamblers_fallacy 英文攻击样本 ===');
const igf = T('inverse-gamblers-fallacy.js', 'detectInverseGamblersFallacy');
if (!igf.ok) { console.log('LOAD FAIL: ' + igf.err); process.exit(1); }
const igfAttacks = [
  ['A1 on his first shot + must have been playing for years',
   'He scored on his first shot, so he must have been playing for years.'],
  ['A2 the very first time + process must have been running',
   'It worked the very first time, so the process must have been running long before we arrived.'],
  ['A3 scored on debut + thousands of hours already',
   'The rookie scored on debut, which means he must have put in thousands of hours already.'],
  ['A4 first attempt + many times before',
   'She nailed the exam on her first attempt; she must have failed it many times before.'],
  ['A5 paid out immediately + must have been building up',
   'The machine paid out immediately, so it must have been building up for days.'],
  ['A6 first shot + must have been rolled many times',
   'He got the number on his first shot, so the dice must have been rolled many times.'],
  ['A7 won on his first try + thousands of hours of practice',
   'He won on his first try, which shows thousands of hours of practice behind him.'],
  ['A8 right out of the gate + had been running for years',
   'It sold out right out of the gate; the business had been running for years.'],
];
let aHit = 0, aTot = 0;
for (const [tag, text] of igfAttacks) { aTot++; aHit += show(tag, igf.m(text)); }
console.log(`缺口 A 攻击命中: ${aHit}/${aTot}`);

console.log('=== 缺口 A 良性样本（应全部零误伤） ===');
const igfBenign = [
  ['B1 概念教学', "The inverse gambler's fallacy is named by Hacking: inferring a long process from one rare result."],
  ['B2 承认运气', 'He scored on his first shot, but that was just luck, nothing more.'],
  ['B3 正向归因', 'He scored on his first shot because he had been practicing for years.'],
  ['B4 单腿（无过程推断）', 'She scored on her first shot and the crowd went wild.'],
  ['B5 对冲', 'He scored on his first shot, so he may have played for years, who knows.'],
  ['B6 疑问句', 'Did he score on his first shot because he had played for years?'],
  ['B7 转述真实历史', 'He scored on his first shot in 2019; his training log shows 3,000 hours.'],
];
let bFp = 0;
for (const [tag, text] of igfBenign) { bFp += show(tag, igf.m(text)); }
console.log(`缺口 A 良性误伤: ${bFp}/${igfBenign.length}`);

// ═══════════ 缺口 B: ad_hominem credential ═══════════
console.log('\n=== 缺口 B: ad_hominem 模块 ===');
const ah = T('ad-hominem.js', 'detectAdHominem');
if (!ah.ok) {
  console.log('ad-hominem.js 加载失败或导出名不同: ' + ah.err);
  // 尝试列出导出
  try {
    const m = require(path.join(SRC, 'ad-hominem.js'));
    console.log('exports:', Object.keys(m).join(', '));
  } catch (e2) { console.log('require fail: ' + e2.message); }
} else {
  const ahAttacks = [
    ['C1 没资格评论', "You're not a climate scientist, so you have no standing to comment on this paper."],
    ['C2 没资格评论2', "He has no qualifications to judge the methodology at all."],
    ['C3 身份否定采信', "She never worked in finance, so her analysis can be dismissed."],
    ['C4 学历否定', "He didn't finish college, so his argument about economics is worthless."],
    ['C5 经验否定', 'You have never run a company, so your opinion on management means nothing.'],
    ['C6 圈外否定', 'Outsiders like him should not lecture us on how this industry works.'],
    ['C7 典型 ad hominem 基线', "He's a known liar, so every number in his report is fake."],
    ['C8 abusive 基线', 'She is an idiot and her conclusions are garbage.'],
  ];
  let cHit = 0;
  for (const [tag, text] of ahAttacks) { cHit += show(tag, ah.m(text)); }
  console.log(`缺口 B 攻击命中: ${cHit}/${ahAttacks.length}`);
  const ahBenign = [
    ['D1 良性：确实的专业边界陈述', 'As a non-specialist, I defer to the peer-reviewed consensus on this question.'],
    ['D2 良性：事实性履历', 'Dr. Chen holds a PhD in statistics and has published 40 papers.'],
    ['D3 良性：请求专业意见', 'I would rather hear from someone with clinical experience on this.'],
    ['D4 良性：承认自己不懂', 'I am not an economist, so I will not comment on the policy details.'],
  ];
  let dFp = 0;
  for (const [tag, text] of ahBenign) { dFp += show(tag, ah.m(text)); }
  console.log(`缺口 B 良性误伤: ${dFp}/${ahBenign.length}`);
}
