// 解决 UPGRADE_LOG.md 冲突：我的 r307 条目置顶 + 远端条目随后
'use strict';
const fs = require('fs');
const p = '/data/home/heartflow/UPGRADE_LOG.md';
const lines = fs.readFileSync(p, 'utf8').split('\n');
const start = lines.findIndex(l => l.startsWith('<<<<<<< Updated upstream'));
const mid = lines.findIndex(l => l === '=======');
const end = lines.findIndex(l => l.startsWith('>>>>>>> Stashed changes'));
if (start < 0 || mid < 0 || end < 0) { console.error('markers not found', start, mid, end); process.exit(1); }
const theirs = lines.slice(start + 1, mid);   // 远端 r305-anchoring + r303-maintenance 等
const mine = lines.slice(mid + 1, end);       // 我的 r307 条目
const rest = lines.slice(end + 1);
const out = mine.concat(theirs, rest);
fs.writeFileSync(p, out.join('\n'));
console.log('resolved. new head:');
console.log(out.slice(0, 2).join('\n'));
console.log('mine lines:', mine.length, 'theirs lines:', theirs.length);
