'use strict';
// r527 规范化：HARM_DENY_ZH 数组里 77-88 是重复插入的批次（fix-branches 与 add-v2
// 各插了一次）。本脚本去重并统一成一支一注释。之后重写 deny-zh 补支的语义以覆盖
// 实测漏检形状。只动 HARM_DENY_ZH 块，其他块不动。
const fs = require('node:fs');
const path = require('node:path');
const p = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
let s = fs.readFileSync(p, 'utf8');
const lines = s.split('\n');

const start = lines.findIndex((l) => l.includes('const HARM_DENY_ZH = new RegExp'));
const end = lines.findIndex((l, i) => i > start && l.includes('].join'));
if (start < 0 || end < 0) { console.error('块定位失败'); process.exit(2); }

// 收集数组内的「字符串行」（去掉注释行的重复）
const body = lines.slice(start + 1, end);
const seen = new Set();
const kept = [];
for (const l of body) {
  const t = l.trim();
  if (t.startsWith('//')) continue;
  if (seen.has(t)) continue;
  seen.add(t);
  kept.push(l);
}
// 重新拼：保留原始注释行位置不可靠，直接把 kept 的字符串行集中放在数组末尾前
const comments = body.filter((l) => l.trim().startsWith('//'));
const newBody = [...comments, ...kept];

lines.splice(start + 1, end - start - 1, ...newBody);
fs.writeFileSync(p, lines.join('\n'));
console.log('HARM_DENY_ZH 去重：' + (body.length - kept.length) + ' 重复行删除，字符串行 ' + kept.length);
