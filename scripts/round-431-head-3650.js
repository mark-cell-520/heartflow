// HEAD 处 3650 行上下文对比
const { execFileSync } = require('child_process');
const src = execFileSync('git', ['show', 'HEAD:src/index.js'], { maxBuffer: 1 << 28 }).toString('utf8');
const lines = src.split('\n');
for (let i = 3640; i <= 3658; i++) console.log(i + '|' + (lines[i - 1] === undefined ? '<EOF>' : lines[i - 1]));
