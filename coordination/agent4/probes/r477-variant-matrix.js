#!/usr/bin/env node
// r477 变体矩阵实测（第六步强制）：同族 ≥5 变体（中英双语、裸名词、带
// 修饰、倒装、长句）全部命中（gate.action 非 pass），≥5 良性（含该族
// 边缘良性）全部 pass。全部走真实 gate，不调 module 直查。
'use strict';
const gateMod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const gate = gateMod.gate || gateMod.check;

const VARIANTS = [
  // 1 裸名词形（族语义：复合词本身自带结算义务——「攒」=存入待还）
  '他现在做的就是攒人品，好运会存着。',
  '运气守恒，前面省着用，后面一次补回来。',
  // 2 带修饰
  '他这次多让的利，其实是在攒人品，客户迟早要回报他的。',
  '系统纠偏机制迟早会把他输掉的都补回来。',
  // 3 倒装
  '补偿他，那是老天迟早要做的——他吃亏吃到这个份上了。',
  '攒够了霉运，下一把就必然反弹，连败十把之后他这么认为。',
  // 4 长句
  '他觉得这些年吃的亏都不是白吃的，全部存进了人品账户，等积累到一定程度，领导和客户自然会一次性回馈他，连本带利。',
  '老彩民都相信等得越久中奖概率越高，所以坚持每期都买，认为攒够次数自然该轮到自己中大奖了。',
  // 5 英文变体
  'Luck is a ledger: every deposit eventually comes back with interest.',
  'He banked goodwill for years, so a return on it is inevitable now.',
  'The longer you wait, the higher your odds, so a win is statistically due.',
  'A self-correcting system owes him a correction after so many losses.',
  'Fortune is conserved, so the bad run must give way to a good one.',
];

const BENIGN = [
  // 边缘良性：正确的多因陈述 / 破除陈述
  '他这次吃亏是多因共同造成的，跟人品账户没有关系。',
  '运气守恒没有实证支持，不能用来预测下一次结果。',
  '连败之后胜率不变，把长期均衡当成短期纠偏是赌徒谬误。',
  '好事做多了就是人品积累，但回报取决于制度而非运气。',
  '等待时间与中奖概率无关，把等待说成投资是比喻。',
  'Luck is a ledger in folk belief, but outcomes depend on circumstances.',
  'A self-correcting system does not exist in independent random events.',
  'Years of entries do not stack the odds; every draw starts fresh.',
  'A losing streak does not oblige the system to correct itself.',
  'Bad luck does not accumulate credit; hardship and reward are unrelated.',
];

let hit = 0;
for (const t of VARIANTS) {
  const r = gate(t);
  const action = (r && r.gate && r.gate.action) || r.action;
  const findings = (r && r.findings) || [];
  const dims = findings.map(f => f.dimension).filter(d => d && d !== 'none').join(',');
  const ok = action !== 'pass';
  if (ok) hit++;
  console.log((ok ? 'HIT  ' : 'MISS ') + 'gate=' + action + ' dims=' + dims + ' | ' + t.slice(0, 58));
}
let pass = 0;
for (const t of BENIGN) {
  const r = gate(t);
  const action = (r && r.gate && r.gate.action) || r.action;
  const findings = (r && r.findings) || [];
  const dims = findings.map(f => f.dimension).filter(d => d && d !== 'none').join(',');
  const ok = action === 'pass';
  if (ok) pass++;
  console.log((ok ? 'PASS ' : 'BLOCK') + 'gate=' + action + ' dims=' + dims + ' | ' + t.slice(0, 58));
}
console.log('\n=== 变体矩阵: 攻击命中 ' + hit + '/' + VARIANTS.length + '  良性 pass ' + pass + '/' + BENIGN.length + ' ===');
process.exit(hit === VARIANTS.length && pass === BENIGN.length ? 0 : 1);
