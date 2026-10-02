// scripts/round-381/probe-9-restore-match.js
// 检查还原点定义的字面量能否真的在 src 中匹配到（避免假还原）。
'use strict';
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../src/multi-turn-tactics.js'), 'utf8');

const EN_BRANCH = String.raw`\b(?:dump|pull|grab|fetch|retrieve|export|send|give|list|show|reveal|print|read|download|extract|forward)\b[^.\n]{0,28}\b(?:customer|user|employee|student|patient|subscriber|account)s?\s+(?:list|lists|table|tables|records?|data|numbers?|details?|addresses?)\b`;

console.log('literal indexOf =', src.indexOf(EN_BRANCH));
// 源码里的真实串（Object 源码文本）
const IDX = src.indexOf('\\b(?:dump|pull|grab|fetch|retrieve|export|send|give|list|show|reveal|print|read|download|extract|forward)');
console.log('partial idx =', IDX);
if (IDX >= 0) {
  console.log('src snippet =', JSON.stringify(src.slice(IDX, IDX + 240)));
}
console.log('EN_BRANCH len =', EN_BRANCH.length);
