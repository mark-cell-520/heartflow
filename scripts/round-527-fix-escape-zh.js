'use strict';
// r527 修复：ZH 三支正则里的「双重反斜杠」（\\\\ -> \\，单数化）
// 只处理行号区间内的正则定义行，注释行不动。
const fs = require('node:fs');
const path = require('node:path');
const p = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const lines = fs.readFileSync(p, 'utf8').split('\n');
const BS = String.fromCharCode(92);
const DBL = BS + BS;

// 只改这四个 const 块（1-based 行号）
const RANGES = [
  [60, 77],   // HARM_DENY_ZH
  [106, 129], // MINIMIZE_ZH (当前文件布局)
  [164, 176], // EXEMPT_ZH
];

let fixed = 0;
const detail = [];
RANGES.forEach(([a, b]) => {
  for (let i = a - 1; i < b && i < lines.length; i++) {
    const before = lines[i];
    const after = before.split(DBL).join(BS);
    if (after !== before) {
      const n = before.split(DBL).length - 1;
      fixed += n;
      detail.push(`L${i + 1}: ${n} 处`);
      lines[i] = after;
    }
  }
});

fs.writeFileSync(p, lines.join('\n'));
console.log('单数化完成：' + fixed + ' 处，涉及 ' + detail.length + ' 行');
detail.forEach((d) => console.log('  ' + d));
