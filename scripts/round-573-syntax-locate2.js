'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// 逐段剥离定位：把 EXEMPT_ZH 段整体替换成无害占位，看是否还有语法错
const fs = require('fs');
const p = __HF + '/src/selective-minimization.js';
const lines = fs.readFileSync(p, 'utf8').split('\n');
// 输出 201-217 每一行的首尾字符，人工查
for (let i = 200; i < 217; i++) {
  const l = lines[i];
  const head = l.slice(0, 3);
  const tail = l.slice(-3);
  console.log((i + 1), JSON.stringify(head), JSON.stringify(tail));
}
