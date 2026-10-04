// 轮次探针：dump HEAD 版 src/index.js 指定行区间（不碰管道）
const { execFileSync } = require('child_process');
const fs = require('fs');
const a = Number(process.argv[2] || 2170);
const b = Number(process.argv[3] || 2200);
let src = '';
try { src = execFileSync('git', ['show', 'HEAD:src/index.js'], { maxBuffer: 1 << 28 }).toString('utf8'); }
catch (e) { console.error('git show failed', e.message); process.exit(2); }
const lines = src.split('\n');
for (let i = a; i <= b; i++) console.log(i + '|' + (lines[i - 1] === undefined ? '<EOF>' : lines[i - 1]));
