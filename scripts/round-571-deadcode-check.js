#!/usr/bin/env node
/* r571：精确判定 src/core/heartflow.js 的 1671-1693 区块是死代码还是可达代码。
 * 方法：按行号区间检查缩进与所属函数边界，并在全文件搜 this.associativeEngine /
 * this.knowledgeLayer 的所有出现位置。 */
'use strict';
const fs = require('fs');
const P = __dirname + '/../src/core/heartflow.js';
const lines = fs.readFileSync(P, 'utf8').split('\n');

// 列出所有顶层/方法级声明行号
const decls = [];
lines.forEach((l, i) => {
  const m = /^  (?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/.exec(l);
  if (m && !/^(if|for|while|switch|catch|return|constructor)$/.test(m[1])) decls.push({ line: i + 1, name: m[1] });
});

function ownerOf(ln) {
  let owner = 'constructor(top-level region)';
  for (const d of decls) { if (d.line <= ln) owner = d.name + ' (line ' + d.line + ')'; else break; }
  return owner;
}

for (const target of [1674, 1685]) {
  console.log('line ' + target + ' -> owner = ' + ownerOf(target));
}
console.log('--- 1671-1693 区块首尾归属:');
console.log('  1671 owner = ' + ownerOf(1671));
console.log('  1693 owner = ' + ownerOf(1693));
console.log('  1671-1693 同属一个函数? ' + (ownerOf(1671) === ownerOf(1693)));

console.log('--- this.associativeEngine 全部出现:');
lines.forEach((l, i) => { if (l.includes('this.associativeEngine')) console.log('  ' + (i + 1) + ': ' + l.trim().slice(0, 90)); });
console.log('--- this.knowledgeLayer 全部出现:');
lines.forEach((l, i) => { if (l.includes('this.knowledgeLayer')) console.log('  ' + (i + 1) + ': ' + l.trim().slice(0, 90)); });

// 前一个方法声明在哪一行结束（找 1671 之前最近的 start()）
let lastDeclBefore = decls.filter(d => d.line < 1671).pop();
console.log('--- 1671 之前最近的方法声明 =', JSON.stringify(lastDeclBefore));
