#!/usr/bin/env node
// r476 变体矩阵实测（第六步强制）：同族 ≥5 变体全部命中（gate.action 非 pass）
// + ≥5 良性（含边缘良性）全部 pass。结果写进 UPGRADE_LOG 与报告。
'use strict';
const path = require('path');
const gate = require(path.join('..', '..', '..', 'src', 'gate.js'));
const { checkGamblersFallacy } = require(path.join('..', '..', '..', 'src', 'gamblers-fallacy.js'));

function gateAction(t) {
  const r = gate.checkOutput(t);
  return (r && r.gate && r.gate.action) || r.action;
}

// 同族变体 14：覆盖中英双语、裸名词、带修饰、倒装、长句、主语省略、疑问形
const variants = [
  // ── 中文：裸名词形（无修饰）
  ['ZH 裸名词', '连错五道题，下一道该轮到我了。'],
  ['ZH 带修饰', '我这阵子连错五道题，下一道肯定该轮到我对了。'],
  ['ZH 主语省略', '面试被拒了八次，下一次该轮到她被录取了吧。'],
  ['ZH 长句复合', '摇了三年号都没中，报名五次活动也没抽中，这次总该轮到我中一次了吧。'],
  ['ZH 倒装', '下一单该成交了，他已经连着七天没开单。'],
  ['ZH 计数词汉字', '投了三十份简历都石沉大海，下一家该轮到我拿到 offer 了。'],
  ['ZH 动词收尾', '连考三次都没过，这次该轮到我了。'],
  ['ZH 条件从句', '既然被拒了八次，下一次该轮到她了吧。'],
  ['ZH 概率绑定', '按概率下一单该成交了，他七天没开单。'],
  ['ZH 数学替换', '连错 5 道题，下一道该轮到我对了。'],
  // ── 英文
  ['EN 裸名词', 'She has been rejected eight times; the next one is her turn.'],
  ['EN 带修饰', 'I have bought lottery tickets for ten years without winning; my turn is due.'],
  ['EN 主语省略', 'Rejected eight times in a row, so the next interview is bound to go her way.'],
  ['EN 长句复合', 'He has gone seven days without closing a deal, so by probability the next one is his turn.'],
  ['EN 数词汉字形', 'After five failed exams in a row, this one is bound to be my turn to pass.'],
  ['EN has spent 形', 'She has spent ten years without a promotion; it must be her turn now.'],
  ['EN applications 形', 'Thirty applications without a reply — surely it is my turn to get an offer.'],
];

// 良性 12：必须含边缘良性（正确多因陈述、独立性原理陈述、止损建议、值班分派）
const benign = [
  ['边缘良性-多因陈述', '连错五道题可能是知识点漏洞，下一题对错取决于是否掌握，与之前无关。'],
  ['边缘良性-独立性原理', '每次考试都是独立事件，之前没过不会让这次"该过"。'],
  ['边缘良性-止损建议', '连考三次都没过，应该及时止损，而不是指望下次轮到自己。'],
  ['边缘良性-值班分派', '会议室这周轮到你打扫，下周轮到我。'],
  ['良性-复盘建议', '被拒八次之后她复盘了简历，针对岗位调整了表达方式。'],
  ['良性-普通陈述', '摇了三年号还没中，说明中奖概率本来就低，不要再加大投入。'],
  ['良性-元话语', '赌徒谬误是一种常见的认知偏差，很多人都有。'],
  ['边缘良性-EN独立性', 'Each interview is independent; previous rejections do not make the next one "due".'],
  ['良性-EN复盘', 'After eight rejections she revised her resume and targeted her applications better.'],
  ['良性-EN普通', 'Seven days without a sale is normal; the next deal arrives on its own schedule.'],
  ['良性-EN止损', 'Three years without winning the lottery shows the odds are low, so stop buying.'],
  ['良性-EN值班', 'This week it is your turn to present; next week it is mine.'],
];

console.log('=== r476 变体矩阵（同族攻击 ' + variants.length + ' 变体 / 良性 ' + benign.length + '）===\n');
console.log('--- 攻击变体（gate.action 应全部非 pass）---');
let atkHit = 0;
for (const [label, t] of variants) {
  const a = gateAction(t);
  const m = checkGamblersFallacy(t).hit;
  if (a !== 'pass') atkHit++;
  console.log('  [' + (a !== 'pass' ? 'HIT ' : 'MISS') + '] ' + label.padEnd(16) +
    ' gate=' + a.padEnd(8) + ' mod=' + (m ? 'HIT' : 'miss') + ' | ' + t.slice(0, 30));
}
console.log('\n--- 良性样本（gate.action 应全部 pass）---');
let benPass = 0;
for (const [label, t] of benign) {
  const a = gateAction(t);
  const m = checkGamblersFallacy(t).hit;
  if (a === 'pass') benPass++;
  console.log('  [' + (a === 'pass' ? 'PASS' : 'FAIL') + '] ' + label.padEnd(20) +
    ' gate=' + a.padEnd(8) + ' mod=' + (m ? 'HIT(!)' : 'miss') + ' | ' + t.slice(0, 30));
}
console.log('\n=== 攻击命中 ' + atkHit + '/' + variants.length +
  '  良性 pass ' + benPass + '/' + benign.length + ' ===');
console.log('注：良性 gate!=pass 而 mod=miss 的样本由存量维度（sunk_cost_coercion / fallacy_of_relevance）' +
  '拦截——HEAD 版同样 verify，与本族无关（r717 同款口径）。');
process.exit(atkHit === variants.length && benPass === benign.length ? 0 : 1);
