// 第 283 轮：精确抓 281 判据群体表（跟在 (?:everyone|everybody|every|each)(?:\s+\w+){0,2}\s+ 之后）
'use strict';
const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8').split('\n');
const l281 = lines[4919];
// 281 群体表：紧跟中缀之后的大 alternation，以 `)\s+(?:is|are)\s+` 结束
const m = l281.match(/\\s\+\\s\+\(\?:((?:[a-z?]+\|)+[a-z?]+)\)\\s\+\(\?:is\|are\)/);
if (!m) { console.log('281 grp NOT matched, head:', l281.slice(0, 150)); process.exit(1); }
const g281 = m[1].split('|');
console.log('281 群体表', g281.length, '词:', g281.join(' '));

const lC = lines[4940];
const mC = lC.match(/own\\s\+\)\?\(\?:((?:[a-z?]+\|)+[a-z?]+)\)\\b/);
const gC = mC[1].split('|');
console.log('\n282C/D 群体表', gC.length, '词');
console.log('\n281 有而 C/D 无的漏词:', g281.filter(x => gC.indexOf(x) === -1).join(' ') || '(无)');
console.log('\nC/D 有而 281 无:', gC.filter(x => g281.indexOf(x) === -1).join(' ') || '(无)');
