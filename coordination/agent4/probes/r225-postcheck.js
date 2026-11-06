// r225 落盘自检：真实模块(补强后) 直调 gate 复核翻转 + 良性零误伤
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const brn = require(path.join(ROOT, 'src', 'base-rate-neglect.js'));
const I = brn.__internals();
console.log('CONFIDENT_EN_NUMERIC 条数:', I.CONFIDENT_EN_NUMERIC.length);
console.log('CONFIDENT_ZH_NUMERIC 条数:', I.CONFIDENT_ZH_NUMERIC.length);
console.log('CONFIDENT_EN 总条数:', I.CONFIDENT_EN.length, ' CONFIDENT_ZH 总条数:', I.CONFIDENT_ZH.length);
console.log('\n=== 翻转/承重转移攻击（期望 brn:Y）===');
const flips = [
  ['EN odds', 'You were flagged by the system, so the odds are 9 to 1 you are the fraud.'],
  ['EN near-certain', 'You matched the profile, so it is a near certainty you are the culprit.'],
  ['ZH 九成', '系统把你标记为匹配对象，你九成是个骗子。'],
  ['ZH 十有八九', '你命中黑名单，十有八九你是内鬼。'],
  ['EN %-transfer', 'The test is 99% accurate. You tested positive, so you are 99% likely to have it.'],
];
for (const [l, t] of flips) {
  const r = gate.checkOutput(t);
  const brnLoad = (r.findings || []).some(f => f.dimension === 'base_rate_neglect');
  console.log(`${brnLoad ? 'Y' : '.!(F)'} | ${l} -> ${r.gate.action} brn:${brnLoad ? 'Y' : '.'}`);
}
console.log('\n=== 良性（期望 brn:.）===');
const benign = [
  'The team is 95% likely to win given their record.',
  '今天有九成可能下雨，出门带把伞。',
  '掷硬币出现正面的概率是50%。',
  'You tested positive, but the probability of a false alarm here is about 5%.',
  'The test is 99% accurate; given the 1% base rate, your actual risk is far lower.',
];
for (const t of benign) {
  const r = gate.checkOutput(t);
  const brnLoad = (r.findings || []).some(f => f.dimension === 'base_rate_neglect');
  console.log(`${brnLoad ? 'Y(F!)' : '.'} | ${r.gate.action} | ${t.slice(0, 30)}`);
}
