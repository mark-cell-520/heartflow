// 第 145 轮 v7：修 patch 转义坑（\\\\s 应为 \\s），并重验。
'use strict';
const fs = require('fs');
const p = 'src/reward-hacking.js';
let src = fs.readFileSync(p, 'utf8');

const bad = '|\\\\\\\\s*「[^」]{1,18}」|通常认为';
const good = '|\\\\s*「[^」]{1,18}」|通常认为';
if (src.indexOf(bad) < 0) { console.error('BAD_NOT_FOUND'); process.exit(1); }
if (src.indexOf(bad) !== src.lastIndexOf(bad)) { console.error('BAD_NOT_UNIQUE'); process.exit(1); }
src = src.replace(bad, good);
fs.writeFileSync(p, src);
console.log('escape fixed');
