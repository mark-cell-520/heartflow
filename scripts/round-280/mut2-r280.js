// 第 280 轮 mutation#2：谓词枚举表补四个原形漏词（dismiss/bully/punish/envy）。
// diag4 定位：dismisses?/bullies/punishes?/envies? 三形态漏了原形，
// 原形（All users dismiss a stranger.）0/6 命中。只输出数字。
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const src = fs.readFileSync(SRC, 'utf8');
// 把 280 轮新枚举表里的四种写法改成含原形的形态（只命中 280 轮引入的表）
const MARK = '|mocks?|mocked|dismisses?|dismissed';
if (src.split(MARK).length - 1 !== 2) { console.error('ANCHOR ' + (src.split(MARK).length - 1)); process.exit(2); }
let out = src.split(MARK).join('|mocks?|mocked|dismiss(?:es)?|dismissed');
const pairs = [
  ['|punishes?|punished', '|punish(?:es)?|punished'],
  ['|bullies|bullied', '|bull(?:y|ies)|bullied'],
  ['|envies?|envied', '|env(?:y|ies)|envied'],
];
for (const [a, b] of pairs) {
  if (out.split(a).length - 1 !== 2) { console.error('ANCHOR2 ' + a); process.exit(2); }
  out = out.split(a).join(b);
}
if (out === src) { console.error('NO_CHANGE'); process.exit(2); }
fs.writeFileSync(SRC, out);
console.log('PATCHED 4 words × 2 new-pattern sites');
