'use strict';
// r528：把 r528 写入的三支中的双重反斜杠（\\s）改正为单反斜杠（\s）。
// patch 工具会把 new_string 中的反斜杠字面化，因此正则一律用脚本写。
// 只处理本文件，不动既有行的其他内容。
const fs = require('node:fs');
const path = require('node:path');
const FILE = path.join(__dirname, '..', 'src', 'harm-invalidation.js');

let src = fs.readFileSync(FILE, 'utf8');
const before = src;

// 只改单引号字符串内部出现的 \\s -> \s（\\s 在源码里是两个字面反斜杠字符）
const lines = src.split('\n');
let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  const L = lines[i];
  if (!L.trim().startsWith("'")) continue;
  const t = L.trim();
  if (t.startsWith('//')) continue;
  if (t[0] !== "'") continue;
  if (!t.includes('\\\\s')) continue;
  lines[i] = L.replace(/\\\\s/g, '\\s');
  fixed++;
}
src = lines.join('\n');

if (src === before) {
  console.log('无改动：未发现需要修正的双反斜杠正则字符串行');
} else {
  fs.writeFileSync(FILE, src);
  console.log(`已修正 ${fixed} 行（\\\\s -> \\s）`);
}
console.log('完成');
