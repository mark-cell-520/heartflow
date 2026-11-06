/**
 * r231 负例注入干跑 — 验证 10 组注入的翻转行为（写正式测试前实证）
 */
'use strict';
const { detectAutomationBias } = require('/data/home/heartflow/src/automation-bias.js');

const A_ZH = '算法的判断比人脑更客观，人工复核只是走过场，可以取消。';
const A_EN = "The algorithm computed the risk score, and algorithms don't have human bias, so there's no need for manual review.";
const A_ZH2 = '机器不会累也不会骗人，让AI来定赔偿金额，比仲裁员公道。';
const A_EN2 = "Machine learning doesn't lie, so the credit score stands and the customer's objection is irrelevant.";
const META_ZH = '把「AI算出来的不会有错所以不用人工复核」当成真理，是自动化偏见的典型表现。';
const META_EN = 'Saying "the AI is never wrong so skip human review" is textbook automation bias.';
const SYS_ZH = '金融系统的风控评分不会出错，人工审批可以取消。';
const FAR = 'AI算出来的结果不会有错。这个结论在内部测试中反复得到确认。我们仔细记录了每一次运行的情况。数据表明它的表现非常稳定。相关文档已经归档备查，所有利益相关方都知悉此结论。复盘结论以邮件形式发送给全员。因此人工复核可以取消。';

const cases = [
  ['N1 MACHINE_ZH=[] → ZH 攻击不命中', () => detectAutomationBias(A_ZH, { MACHINE_ZH: [] }).hit, false],
  ['N2 MACHINE_EN=[] → EN 攻击不命中', () => detectAutomationBias(A_EN, { MACHINE_EN: [] }).hit, false],
  ['N3 INFALLIBLE_ZH=[] → ZH 攻击不命中', () => detectAutomationBias(A_ZH2, { INFALLIBLE_ZH: [] }).hit, false],
  ['N4 INFALLIBLE_EN=[] → EN 攻击不命中', () => detectAutomationBias(A_EN2, { INFALLIBLE_EN: [] }).hit, false],
  ['N5 DEFERENCE_ZH=[] → ZH 攻击不命中', () => detectAutomationBias(A_ZH, { DEFERENCE_ZH: [] }).hit, false],
  ['N6 DEFERENCE_EN=[] → EN 攻击不命中', () => detectAutomationBias(A_EN, { DEFERENCE_EN: [] }).hit, false],
  ['N7 EXEMPT_CORRECT_ZH=[] → 元话语纠正句变红', () => detectAutomationBias(META_ZH, { EXEMPT_CORRECT_ZH: [] }).hit, true],
  ['N8 EXEMPT_CORRECT_EN=[] → 元话语纠正句变红', () => detectAutomationBias(META_EN, { EXEMPT_CORRECT_EN: [] }).hit, true],
  ['N9 EXEMPT_SYSTEM_ZH=[] → 金融系统句变红', () => detectAutomationBias(SYS_ZH, { EXEMPT_SYSTEM_ZH: [] }).hit, true],
  ['N10a 长距句默认窗 → 不命中', () => detectAutomationBias(FAR).hit, false],
  ['N10b 长距句 WIN_PAIR_ZH=120 → 命中', () => detectAutomationBias(FAR, { WIN_PAIR_ZH: 120 }).hit, true],
];
let ok = 0, bad = 0;
for (const [name, fn, expect] of cases) {
  let got;
  try { got = fn(); } catch (e) { got = 'ERR:' + e.message; }
  const good = got === expect;
  if (good) ok++; else bad++;
  console.log((good ? 'ok  ' : 'BAD ') + name + ' | got=' + got + ' expect=' + expect);
}
console.log('注入小计: 符合 ' + ok + ' / 不符 ' + bad);
