/**
 * r535 诊断：逐行检查 src/performative-responsibility.js 第 190-215 行
 * 的精确字符（charCode），识别双反斜杠/控制字符/丢失的 join。
 * 用法: node scripts/round-535-line-diag.js
 */
'use strict';
const fs = require('node:fs');
const lines = fs.readFileSync(require.resolve('../src/performative-responsibility.js'), 'utf8').split('\n');
for (let i = 189; i <= 216 && i < lines.length; i++) {
  const ln = lines[i];
  if (ln === undefined) continue;
  const marks = [];
  for (let j = 0; j < ln.length; j++) {
    const c = ln.charCodeAt(j);
    if (c === 0x5c) marks.push(j);
  }
  console.log(`${i + 1}[bs@${marks.join(',')}]: ${ln}`);
}
