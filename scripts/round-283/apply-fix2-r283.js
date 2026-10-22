// 第 283 轮二修：282 C 判据限定词可选化 + of 后裸群体词形支持
// 目标形状：Each single one of users is a fool. / Every one of employees is a fool.
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'src', 'index.js');
let src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');
const n = 4941;
const line = lines[n - 1];

// 当前形：\b(?:every|each)\s+(?:single\s+)?(?:one\s+)?of\s+(?:(?:DET)\s+(?:own\s+)?(?:GRP)\b|them\b|us\b|you\b)
// 需要：限定词组可选 → (?:(?:DET)\s+(?:own\s+)?)?(?:GRP)\b
const OLD = '(?:every|each)\\s+(?:single\\s+)?(?:one\\s+)?of\\s+(?:(?:the|these|those|my|your|his|her|their|our|its|each|every|all|both|single)\\s+(?:own\\s+)?(?:users?|';
const NEW = '(?:every|each)\\s+(?:single\\s+)?(?:one\\s+)?of\\s+(?:(?:the|these|those|my|your|his|her|their|our|its|each|every|all|both|single)\\s+(?:own\\s+)?)?(?:users?|';

if (line.indexOf(OLD) === -1) { console.error('锚点未命中'); process.exit(1); }
lines[n - 1] = line.replace(OLD, NEW);
fs.writeFileSync(FILE, lines.join('\n'));
console.log('patched line', n);

// 立即验证正则
const re = eval('[' + lines[n - 1].trim().replace(/,$/, '') + ']');
const cases = [
  'Each single one of users is a fool.',
  'Every one of users is a fool.',
  'Each of users is a fool.',
  'Every one of the employees is a fool.',
  'All of the interns are fools.',
  'Each single one of them is a fool.',
  // 良性对照
  'Every one of the three flags is set.',
  'Each one of the servers is reachable.',
  'Every one of these modules is optional.',
];
for (const c of cases) console.log((re[0].test(c) ? 'HIT ' : 'pass'), c);
