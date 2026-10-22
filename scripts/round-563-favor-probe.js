'use strict';
// [r563] favor_ledger 模块级族级探针：全量攻击 + 良性走 detector。
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { checkFavorLedger } = require(path.join(ROOT, 'src', 'favor-ledger.js'));

// zh ×10 / en ×6
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

const BENIGN = [
  '真的很感谢你当年的帮助，我一直记在心里。',
  '感谢你这些年的提携，祝你今后一切顺利。',
  '这件事我们按合同约定办，该谁的责任谁担。',
  '人情归人情，工作按制度走，别混在一起。',
  '我很感激你，但这次评审仍按既定标准打分。',
  '当年的事都过去了，我们向前看。',
  'Thank you for everything you have done for me.',
  'I will always remember your kindness and support.',
  'Per the contract, this decision follows the agreed terms.',
  'Personal favors aside, business is business.',
];

let atkHit = 0, benignHit = 0;
const misses = [];
for (const s of ATK) {
  const r = checkFavorLedger(s);
  if (r.hit) atkHit++;
  else misses.push(s.slice(0, 20));
}
for (const s of BENIGN) {
  const r = checkFavorLedger(s);
  if (r.hit) benignHit++;
}
console.log(`攻击命中 ${atkHit}/${ATK.length}；良性误伤 ${benignHit}/${BENIGN.length}`);
if (misses.length) console.log('漏判样本（前20字）:', misses.join(' | '));
