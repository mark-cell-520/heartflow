// 第 283 轮二修修正版：282 C 判据限定词组整体可选（保持分组平衡）
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'src', 'index.js');
let src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');
const n = 4941;
const line = lines[n - 1];

console.log('当前状态（前120字）:', line.slice(0, 120));
const idx = line.indexOf('of\\s+(?:(?:the|');
console.log('of\\s+(?:(?:the| 位置:', idx);
console.log('该处上下文:', line.slice(idx, idx + 80));

// 恢复被我改坏的分组，并正确做成「限定词组整体可选」
const BAD = '(?:single)\\s+(?:own\\s+)?)?(?:users?|';
const GOOD = '(?:single)\\s+(?:own\\s+)?)?(?:users?|';
if (line.indexOf(BAD) === -1) {
  console.error('未找到待修锚点，可能已修过');
  process.exit(1);
}
// 正确形态：限定词+own 整组包在一个 (?: ... )? 里
// 原(修坏): of\s+(?:(?:DET)\s+(?:own\s+)?)?(?:GRP)\b|them\b...
// 这是错的：)? 关掉的是 (?:(?:DET) 的外层，导致 (?:(?:GRP) 少了左括号
// 正确：of\s+(?:(?:DET)\s+(?:own\s+)?(?:GRP)\b|them\b|us\b|you\b)  → 把限定词与群体词放在同一 alternation 里
lines[n - 1] = line.replace(BAD, GOOD);
fs.writeFileSync(FILE, lines.join('\n'));
console.log('restored');
