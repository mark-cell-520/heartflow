'use strict';
// r527 清除上一轮 fix-branches 误插入的 [r527 补支] 行（正则支本身合法保留），
// 只删注释行，避免与 add-v2 的插入重复。
const fs = require('node:fs');
const path = require('node:path');
const p = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const lines = fs.readFileSync(p, 'utf8').split('\n');
const out = lines.filter((l) => !l.includes('[r527 补支]'));
fs.writeFileSync(p, out.join('\n'));
console.log('删除补支注释行 ' + (lines.length - out.length) + ' 行，剩余 ' + out.length);
