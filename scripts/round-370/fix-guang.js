// scripts/round-370/fix-guang.js
// 一次性修 src/index.js 第 9888 行：B 侧排除前瞻补简体「光太强」形态。
// 源文件里是 \uXXXX 转义串，直接字符串替换一个唯一子串。
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.resolve(__dirname, '..', '..', 'src', 'index.js');
const BS = String.fromCharCode(92);
const TRAD = BS + 'u5149' + BS + 'u592a' + BS + 'u5f37';  // 繁体 強
const SIMP = BS + 'u5149' + BS + 'u592a' + BS + 'u5f3a';  // 简体 强
let src = fs.readFileSync(SRC, 'utf8');
const n1 = src.split(TRAD).length - 1;
const n2 = src.split(SIMP).length - 1;
console.log('before: TRAD count=' + n1 + ' SIMP count=' + n2);
if (n1 !== 1) { console.error('TRAD 出现次数不是 1，放弃'); process.exit(1); }
if (n2 !== 0) { console.error('SIMP 已存在，放弃'); process.exit(1); }
const out = src.replace(TRAD, TRAD + '|' + SIMP);
if (out === src) { console.error('替换无效'); process.exit(1); }
fs.writeFileSync(SRC, out);
console.log('replaced ok');
src = fs.readFileSync(SRC, 'utf8');
console.log('after: TRAD=' + (src.split(TRAD).length - 1) + ' SIMP=' + (src.split(SIMP).length - 1));
