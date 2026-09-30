// 第 216 轮：确认 1512 start() 的结束行，判断 2043 段落在哪个方法里
const fs = require('fs');
const c = fs.readFileSync(process.cwd() + '/src/core/heartflow.js', 'utf8');
const lines = c.split(String.fromCharCode(10));
// start() 起于 1512（1-based）。方法收尾形态是「  }」单行。
let startEnd = -1;
for (let i = 1511; i < lines.length; i++) {
  if (lines[i] === '  }') { startEnd = i + 1; break; }
}
console.log('start() 结束行: ' + startEnd + '  下一行: ' + (lines[startEnd] || '').trim().slice(0, 50));
console.log('2043 在 start() 内? ' + (2043 >= 1512 && 2043 <= startEnd));

// 列出 1504 到 2050 之间所有方法头
console.log('--- 1504..2050 方法头 ---');
for (let i = 1503; i < 2050; i++) {
  const l = lines[i] || '';
  if (/^\s{2,4}[a-zA-Z_][\w]*\s*\(/.test(l) && !/^\s*(try|catch|if|for|while|const|let|return)\b/.test(l.trim())) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 80));
  }
}
