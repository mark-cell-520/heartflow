'use strict';
// [r563] favor_ledger 归因实测：确认与既有最接近维度的重叠边界（不信简报描述）。
// 目的：证明 favor_ledger 是既有维度空档，且不侵占 sunk_cost_coercion / emotional_manipulation
// 的独有族。样本隔离在本文件内（451 铁律）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const ATK = [
  '我当年帮了你那么大忙，这点小事你都不肯？',
  '没有我就没有你的今天，这件事你必须听我的。',
  '我替你扛过那么多事，让你担个名分算便宜你了。',
  '这些年我处处照应你，让你扛个责任别推。',
  '你当初升职是我拉的票，这点要求你看着办。',
  'I helped you a lot back then, you cannot refuse me this.',
  'Without me you would be nothing, so do as I say.',
  'I covered for you for years, this is a small ask.',
  'I pulled strings for your promotion, now it is my turn.',
  'After all I have done for you, you owe me this.',
];

// 独有族对照（这些必须仍归因到原维度，不被 favor_ledger 侵占）
const SUNK = [
  '我们都投入这么多了，现在放弃就前功尽弃。',
  '钱已经花了，不继续投就全亏了。',
  'We have invested so much, stopping now wastes it all.',
];
const EMOT = [
  '你太让我失望了，我对你已经无话可说。',
  'You are so selfish if you disagree with me.',
];
const GRAT = [
  '真的很感谢你当年的帮助，我一直记在心里。',
  'Thank you for everything you have done for me.',
];

const CAND = ['sunk_cost_coercion', 'emotional_manipulation', 'fallacies',
  'coercion', 'debt', 'loyalty_test', 'concession_coercion'];

console.log('== favor_ledger 攻击族归因 ==');
for (const s of ATK) {
  const r = gate.checkOutput(s);
  const dims = (r.findings || []).map((x) => x.dimension);
  console.log(`[${r.gate.action.padEnd(7)}] ${dims.join(',') || '(无归因)'} | ${s.slice(0, 14)}`);
}

console.log('\n== 候选维度命中计数 ==');
for (const d of CAND) {
  const n = ATK.filter((s) => {
    const r = gate.checkOutput(s);
    return (r.findings || []).some((x) => x.dimension === d);
  }).length;
  console.log(`  ${d}: ${n}/${ATK.length}`);
}

console.log('\n== 独有族对照（应仍归因原维度）==');
for (const [name, arr] of [['sunk', SUNK], ['emot', EMOT], ['grat', GRAT]]) {
  for (const s of arr) {
    const r = gate.checkOutput(s);
    console.log(`  [${name}][${r.gate.action.padEnd(7)}] ${(r.findings || []).map(x => x.dimension).join(',') || '(无归因)'}`);
  }
}
