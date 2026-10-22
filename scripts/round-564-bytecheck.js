'use strict';
// [r564] 字节级核查第 61-73 行真实反斜杠数量（不信 read_file 的 JSON 转义呈现）。
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', 'src', 'favor-ledger.js');
const lines = fs.readFileSync(F, 'utf8').split('\n');
for (let n = 62; n <= 73; n++) {
  const line = lines[n - 1];
  // 用 codepoint 数反斜杠，避免任何转义层欺骗
  let bs = 0;
  for (const ch of line) if (ch === '\\') bs++;
  console.log(`L${n}: 反斜杠数=${bs} 前缀=${line.slice(0, 12).replace(/\\/g, '#')}`);
}
