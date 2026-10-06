'use strict';
// r527 修复 src/harm-invalidation.js:216 的 isZh 判错
// 文件里当前是 /[\\u4e00-\\u9fff]/ （反斜杠+u 字面量），中文被判为英文
// 目标形态 /[\u4e00-\u9fff]/，即 JS 源码中反斜杠 + u 序列（正则 unicode 类）
const fs = require('node:fs');
const p = require('node:path').join(__dirname, '..', 'src', 'harm-invalidation.js');
let s = fs.readFileSync(p, 'utf8');

const bad = 'const isZh = /[' + String.fromCharCode(92) + String.fromCharCode(92) + 'u4e00-' + String.fromCharCode(92) + String.fromCharCode(92) + 'u9fff]/.test(text);';
const good = 'const isZh = /[' + String.fromCharCode(92) + 'u4e00-' + String.fromCharCode(92) + 'u9fff]/.test(text);';

if (!s.includes(bad)) {
  console.log('NOT_FOUND bad pattern; 当前 isZh 行 =',
    JSON.stringify((s.split('\n').find((l) => l.includes('isZh')) || '').trim()));
  process.exit(2);
}
s = s.replace(bad, good);
fs.writeFileSync(p, s);
console.log('PATCHED isZh =', JSON.stringify((s.split('\n').find((l) => l.includes('isZh')) || '').trim()));
