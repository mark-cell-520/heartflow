/**
 * 校验 diag3 的 EN 支解析是否正确：逐一 print 每支 len + 首 40 字符形状。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const SRC = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'moral-licensing.js'), 'utf8');

const start = SRC.indexOf('const PERMIT_EN = new RegExp([');
const endAt = SRC.indexOf("].join('|'), 'i');", start);
const block = SRC.slice(start, endAt);
const lines = block.split('\n').filter(l => /^\s*['"]/.test(l));
console.log(`共 ${lines.length} 行`);
lines.forEach((l, i) => {
  const q = l.trim().replace(/^['"](.*)['"],?$/, '$1');
  console.log(`${i}: len=${q.length} head=${q.slice(0, 30)}`);
});
