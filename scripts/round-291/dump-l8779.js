'use strict';
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// 打印 8778-8780 行的字面字符（区分 \uXXXX 转义与真实中文字符）
const fs = require('fs');
const p = __HF + '/src/index.js';
const lines = fs.readFileSync(p, 'utf8').split('\n');
for (let i = 8777; i <= 8780; i++) {
  const l = lines[i - 1];
  console.log(`--- line ${i} (len=${l ? l.length : 0}) ---`);
  if (!l) continue;
  // 每 60 字符一段打印，显示原始字节形态
  for (let j = 0; j < l.length; j += 60) {
    console.log('  [' + j + '] ' + JSON.stringify(l.slice(j, j + 60)));
  }
}
