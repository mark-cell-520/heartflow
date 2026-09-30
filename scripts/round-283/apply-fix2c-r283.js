// 第 283 轮 fix2 修正：把 4941 行已损坏的限定词组恢复成正确的「可选限定词」形态
// 损坏形态（fix2 引入）：of\s+(?:(?:DET)\s+(?:own\s+)?)?(?:GRP)\b|them\b|us\b|you\b)
//   ↑ `)?` 提前关掉了 (?:(?:DET) 组，使 (?:(?:GRP) 缺左括号
// 正确形态：of\s+(?:(?:DET)\s+(?:own\s+)?)?(?:GRP)\b|them\b|us\b|you\b)  —— 不行，
// 分组平衡要求：限定词组单独成组后整体可选，群体组保持原样。
// 最终形态：of\s+(?:(?:DET)\s+(?:own\s+)?)?(?:GRP)\b|them\b|us\b|you\b)
// 展开写（不用嵌套歧义）：
//   of\s+(?:(?:DET)\s+(?:own\s+)?(?:GRP)\b|them\b|us\b|you\b)
//   + 另一支：of\s+(?:GRP)\b  （无限定词）
// JS 正则无 atomic，用 alternation 两个分支最稳：
//   of\s+(?:(?:(?:DET)\s+(?:own\s+)?)?(?:GRP)\b|them\b|us\b|you\b)
// 这仍是错的：问题是 DET 组的 `)` 少了。
// 重新数原始行的括号：
//   (?:(?:the|...|single)\s+(?:own\s+)?(?:GRP)\b|them\b|us\b|you\b)
//   ^1                                                ^1
// fix2 把 `(?:the` 开头的组改成了 `)?`，即 (?:(?:the|...)  变 (?:(?:the|...)\s+(?:own\s+)?
// 也就是在 own 组后加了 `)` 把外层 (?:(?:DET) 关成 (?:(?:DET)...) —— 但原本 (?:DET) 本来就要关。
// 唯一真正的问题是：`)?` 的 `?` 让整个限定词组可选了，但它关错了括号层级。
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'src', 'index.js');
const lines = fs.readFileSync(FILE, 'utf8').split('\n');
const n = 4941;
const line = lines[n - 1];

// 直接从当前行重建正确的正则：把 `)?` 修正为 `)?` 的位置正确化
// 原始(正确)：of\s+(?:(?:DET)\s+(?:own\s+)?(?:GRP)\b|them\b|us\b|you\b)
// 期望(正确)：of\s+(?:(?:DET)\s+(?:own\s+)?)?(?:GRP)\b|them\b|us\b|you\b)
//   不行 —— `)?` 关掉 (?:(?:DET) 后，剩余 `(?:GRP)\b|them\b|us\b|you\b)` 里 `)` 无主。
// 唯一自洽的形态：限定词+own 整体可选，且群体表与代词表仍在同一个大 alternation 内：
//   of\s+(?:(?:(?:DET)\s+(?:own\s+)?)?(?:GRP)\b|them\b|us\b|you\b)
// 即在原始 `(?:(?:DET)` 前插入 `(?:`，在 `own\s+)?` 后插 `?`。
const OLD = 'of\\s+(?:(?:the|these|those|my|your|his|her|their|our|its|each|every|all|both|single)\\s+(?:own\\s+)?(?:users?|';
const FIXED = 'of\\s+(?:(?:(?:the|these|those|my|your|his|her|their|our|its|each|every|all|both|single)\\s+(?:own\\s+)?)?(?:users?|';

// 先撤回 fix2 的 `)?`（把它变回 `)?` 在正确位置）—— 直接以 FIXED 为目标替换当前的损坏段
const CURRENT_BAD = 'of\\s+(?:(?:the|these|those|my|your|his|her|their|our|its|each|every|all|both|single)\\s+(?:own\\s+)?)?(?:users?|';
if (line.indexOf(CURRENT_BAD) !== -1) {
  lines[n - 1] = line.replace(CURRENT_BAD, FIXED);
  console.log('从损坏态修正为 FIXED');
} else if (line.indexOf(OLD) !== -1) {
  lines[n - 1] = line.replace(OLD, FIXED);
  console.log('从原始态修正为 FIXED');
} else {
  console.error('锚点均未命中，手动检查'); process.exit(1);
}
fs.writeFileSync(FILE, lines.join('\n'));

// 括号平衡自检
const re = eval('[' + lines[n - 1].trim().replace(/,$/, '') + ']');
console.log('括号平衡 OK, 正则可编译');
const cases = [
  'Each single one of users is a fool.',
  'Every one of users is a fool.',
  'Each of users is a fool.',
  'Every one of the employees is a fool.',
  'All of the interns are fools.',
  'Each single one of them is a fool.',
  'Every one of the three flags is set.',
  'Each one of the servers is reachable.',
  'Every one of these modules is optional.',
  'Each of them is responsible for its own config.',
];
for (const c of cases) console.log((re[0].test(c) ? 'HIT ' : 'pass'), c);
