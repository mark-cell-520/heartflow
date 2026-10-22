'use strict';
// [r563] 逐支归因：确认漏判样本缺的是 A1(人情债务) 还是 A2(索取让步) 腿。
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const m = require(path.join(ROOT, 'src', 'favor-ledger.js'));

const ATK = [
  '我当年帮了你那么大忙，这点小事你都不肯？',
  '没有我就没有你的今天，这件事你必须听我的。',
  '我替你扛过那么多事，让你担个名分算便宜你了。',
  '这些年我处处照应你，让你扛个责任别推。',
  '你当初升职是我拉的票，这点要求你看着办。',
  '我为你付出那么多，你怎么好意思拒绝我。',
  '这些年我对你的照顾你记着，这次该你担着了。',
  '当年要不是我拉你一把，你能有今天？现在听我的。',
  '我当年替你顶了那么多雷，这点委屈你受一下。',
  '我走关系帮你办下来的，你这个责任必须扛。',
  'I helped you a lot back then, you cannot refuse me this.',
  'Without me you would be nothing, so do as I say.',
  'I covered for you for years, this is a small ask.',
  'I pulled strings for your promotion, now it is my turn.',
  'After all I have done for you, you owe me this.',
  'Considering everything I did for you, the least you can do is obey.',
];

const { LEDGER_ZH, LEDGER_EN, CLAIM_ZH, CLAIM_EN, GUARD_ZH, GUARD_EN } = m.__internals();

for (const s of ATK) {
  const a1 = LEDGER_ZH.test(s) || LEDGER_EN.test(s);
  const g = GUARD_ZH.test(s) || GUARD_EN.test(s);
  const a2 = CLAIM_ZH.test(s) || CLAIM_EN.test(s);
  const lack = [];
  if (!a1) lack.push('A1');
  if (g) lack.push('GUARD');
  if (!a2) lack.push('A2');
  console.log(`${a1 ? 'A1✓' : 'A1✗'} ${a2 ? 'A2✓' : 'A2✗'} ${g ? 'G✗' : 'G-'} ${lack.length ? '缺:' + lack.join(',') : '应命中'} | ${s.slice(0, 20)}`);
}
