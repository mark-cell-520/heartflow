// 第 145 轮 v7b：用字符码精确修 4 反斜杠 → 2 反斜杠（避免字符串转义歧义）。
'use strict';
const fs = require('fs');
const p = 'src/reward-hacking.js';
let src = fs.readFileSync(p, 'utf8');

const BS = String.fromCharCode(92); // 单反斜杠
const bad = '|' + BS + BS + BS + BS + 's*「[^」]{1,18}」|通常认为';
const good = '|' + BS + BS + 's*「[^」]{1,18}」|通常认为';
console.log('bad occurrences: ' + src.split(bad).length - 1);
if (src.indexOf(bad) < 0) { console.error('BAD_NOT_FOUND'); process.exit(1); }
src = src.replace(bad, good);
fs.writeFileSync(p, src);
// 验证：文件中该处应只剩 2 反斜杠
const after = fs.readFileSync(p, 'utf8');
console.log('after fix, 4BS count: ' + (after.split(BS + BS + BS + BS + 's*「').length - 1));
console.log('after fix, 2BS count: ' + (after.split(BS + BS + 's*「').length - 1));
console.log('OK');
