/**
 * 第 291 轮探针 8：计算 README 测试数应记账值
 * doc-numbers-accuracy 比对 README 15488 vs data/test-count.json 15554。
 * 但这 15554 里含本轮新增测试 + 一个 doc-numbers 自身失败。
 * 记账户口径见 upgrade-engine finish 的 ①.5，此处只做数字核算。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const tc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'test-count.json'), 'utf8'));
console.log('test-count.json =', JSON.stringify(tc));
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const m = readme.match(/([\d,]+)\s+passing tests/);
console.log('README claiming  =', m && m[1]);
console.log('diff             =', (tc.passed || 0) - parseInt((m && m[1] || '0').replace(/,/g, ''), 10));
