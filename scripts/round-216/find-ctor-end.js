// 第 216 轮：找 constructor 真正结束行（class 内方法用 2 空格缩进收尾）
const fs = require('fs');
const c = fs.readFileSync(process.cwd() + '/src/core/heartflow.js', 'utf8');
const lines = c.split(String.fromCharCode(10));
// constructor 从 1165 开始；找第一个「单独一行 }」且缩进为 2 空格的
for (let i = 1164; i < lines.length; i++) {
  if (lines[i] === '  }') {
    console.log('constructor 结束行: ' + (i + 1) + ' (下一行 ' + (i + 2) + ': ' + (lines[i + 1] || '').trim().slice(0, 60) + ')');
    console.log('2043-2051 在 constructor 内? ' + (2043 >= 1165 && 2051 <= i + 1));
    break;
  }
}
