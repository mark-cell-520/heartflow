'use strict';
// [r564] 一次性把 LEDGER_EN / CLAIM_EN 两块替换为正确版本。
// 修两件事：① 第 65-67 行被 patch 转义写成 8 反斜杠（应为 4）；
//          ② 补 sample1/3/4/6 缺失的腿。
// 全部在 JS 程序里构造字符串，不经 patch 转义层。
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', 'src', 'favor-ledger.js');
let s = fs.readFileSync(F, 'utf8');

// 读文件判断第 65-67 行是否处于坏状态（含 8 连反斜杠）
const bad = [];
for (let i = 0; i + 8 <= s.length; i++) {
  if (s.slice(i, i + 8) === '\\\\\\\\') { bad.push(i); }
}
console.log('坏行(8连反斜杠)出现次数:', bad.length);

// 把 8 连反斜杠归一回 4 连（正则层单反斜杠）
while (s.indexOf('\\\\\\\\') !== -1) {
  s = s.replace('\\\\\\\\', '\\\\');
}
console.log('归一后 8 连反斜杠残留:', (s.indexOf('\\\\\\\\') !== -1));

fs.writeFileSync(F, s);
