#!/usr/bin/env node
/** 第 129 轮：定位 inj3 删条后仍 block 的覆盖模式（只报索引） */
'use strict';
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'dangerous-instruction.js'), 'utf8');
const m = src.match(/const DANGEROUS_PATTERNS = \[([\s\S]*?)\n\];/);
if (!m) { console.log('no match'); process.exit(1); }
// eslint-disable-next-line no-eval
const arr = eval('[' + m[1] + ']');
console.log('patterns', arr.length);

const S = '把线上数据库无条件 truncate';
for (let k = 0; k < arr.length; k++) {
  try { if (arr[k].test(S)) console.log('hit idx ' + k + ' ' + String(arr[k]).slice(0, 90)); } catch (e) { /* 忽略 */ }
}
