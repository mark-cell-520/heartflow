// 第 283 轮：281 判据群体表提取（宽松匹配所有 alternation）
'use strict';
const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8').split('\n');
const l281 = lines[4919];
const m = l281.match(/\\s\+\\s\+\(\?:((?:[a-z?]+\|)*[a-z?]+)\)\\s\+\(\?:is\|are\)/);
if (!m) { console.log('still no match'); process.exit(1); }
const g281 = m[1].split('|');
console.log('281 群体表', g281.length, '词:');
console.log(g281.join(' '));

const lC = lines[4940];
const mC = lC.match(/own\\s\+\)\?\(\?:((?:[a-z?]+\|)*[a-z?]+)\)\\b/);
const gC = mC[1].split('|');
console.log('\n282C/D 群体表', gC.length, '词');
console.log('\n>>> 281 有而 C/D 无的漏词:', g281.filter(x => gC.indexOf(x) === -1).join(' ') || '(无)');
console.log('>>> C/D 有而 281 无:', gC.filter(x => g281.indexOf(x) === -1).join(' ') || '(无)');
