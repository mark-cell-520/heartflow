/**
 * 第 291 轮探针 7：定位 README 测试数失配（doc-numbers-accuracy 唯一失败项）
 * 该测试比对 README 声明的测试数 vs data/test-count.json，或实测 count。
 * 本轮运行前 README=15488、init 简报说缓存=14668，
 * 而 run-all 实测 15555 —— 三个数互不一致，先搞清各自口径。
 * 只打印数字与文件路径，不贴样本。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

function readN(p) { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } }

const readme = readN(path.join(ROOT, 'README.md')) || '';
const skmd = readN(path.join(ROOT, 'SKILL.md')) || '';
const tcount = readN(path.join(ROOT, 'data', 'test-count.json')) || '';

console.log('README 里的数字（正则抓 digits 前后文）:');
const re = /[^\n]{0,40}\d{4,6}[^\n]{0,40}/g;
let m, n = 0;
while ((m = re.exec(readme)) && n < 12) { console.log('  ', m[0].trim()); n++; }

console.log('\nSKILL.md 里的数字:');
const re2 = /[^\n]{0,40}\d{4,6}[^\n]{0,40}/g;
n = 0;
while ((m = re2.exec(skmd)) && n < 12) { console.log('  ', m[0].trim()); n++; }

console.log('\ndata/test-count.json 原文:');
console.log(tcount.slice(0, 1200));
