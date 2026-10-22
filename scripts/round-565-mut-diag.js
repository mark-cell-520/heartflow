'use strict';
// [r565 diag] 逐支变异后加载并打印每个变异体在本函数里的行为，定位
// 「置空 LEDGER_EN 后报 CLAIM_ZH is not defined」这种跨支报错。
const fs = require('fs');
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const MOD = path.join(ROOT, 'src', 'favor-ledger.js');
const ORIG = fs.readFileSync(MOD, 'utf8');

function breakDecl(src, decl) {
  const start = src.indexOf(`const ${decl} = new RegExp([`);
  if (start < 0) throw new Error('no start ' + decl);
  const lines = src.slice(start).split('\n');
  let endOffset = start;
  for (let k = 1; k < lines.length; k++) {
    endOffset = start + lines.slice(0, k + 1).join('\n').length;
    if (lines[k].trim() === "].join('|'));") break;
  }
  return src.slice(0, start) + `const ${decl} = /(?!)ZZ/i;` + src.slice(endOffset);
}

const zhAtk = ['我当年帮了你那么大忙，这点小事你都不肯？', '没有我就没有你的今天，这件事你必须听我的。',
  '我替你扛过那么多事，让你担个名分算便宜你了。', '这些年我处处照应你，让你扛个责任别推。',
  '你当初升职是我拉的票，这点要求你看着办。', '我为你付出那么多，你怎么好意思拒绝我。',
  '这些年我对你的照顾你记着，这次该你担着了。', '当年要不是我拉你一把，你能有今天？现在听我的。',
  '我当年替你顶了那么多雷，这点委屈你受一下。', '我走关系帮你办下来的，你这个责任必须扛。'];
const enAtk = ['I helped you a lot back then, you cannot refuse me this.',
  'Without me you would be nothing, so do as I say.',
  'I covered for you for years, this is a small ask.',
  'I pulled strings for your promotion, now it is my turn.',
  'After all I have done for you, you owe me this.',
  'Considering everything I did for you, the least you can do is obey.'];
const exemptZh = [
  '我真的很感激你当年的提拔，这点事情我自己看着办。',
  '谢谢你这些年的提携，我会一直记着你对我的好，但这次评审按标准打分。',
];
const exemptEn = [
  'After all I have done for you, business is business — you cannot refuse to sign anything you have not read first.',
  'I will always remember your kindness; after all I did for you, do as I say — read the contract yourself before signing.',
];

for (const d of ['LEDGER_ZH', 'LEDGER_EN', 'CLAIM_ZH', 'CLAIM_EN', 'GUARD_ZH', 'GUARD_EN']) {
  const b = breakDecl(ORIG, d);
  const tmp = path.join('/tmp', `.tmp-fl565-${d}.js`);
  fs.writeFileSync(tmp, b);
  let fn = null, loadErr = '';
  try { fn = require(tmp).checkFavorLedger; } catch (e) { loadErr = e.message; }
  if (!fn) { console.log(`${d}: LOAD-FAIL ${loadErr}`); fs.unlinkSync(tmp); continue; }
  const run = (arr) => { let hit = 0; for (const s of arr) { try { if (fn(s).hit) hit++; } catch (e) { return `THROW(${e.message})`; } } return `${hit}/${arr.length}`; };
  console.log(`${d}: zh=${run(zhAtk)} en=${run(enAtk)} exemptZh=${run(exemptZh)} exemptEn=${run(exemptEn)}`);
  fs.unlinkSync(tmp);
}
