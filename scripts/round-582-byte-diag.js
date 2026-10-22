// r582: 字节级诊断 —— 判断磁盘文本里到底是单反斜杠还是双反斜杠
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'src', 'exclusive-trust.js');
const raw = fs.readFileSync(p, 'utf8');
const lines = raw.split('\n');

function show(n) {
  const line = lines[n - 1];
  console.log('L' + n + ': ' + JSON.stringify(line.slice(0, 70)));
  // 统计反斜杠出现次数
  let bs = 0;
  for (const ch of line) if (ch === '\\') bs++;
  console.log('   backslash count in line = ' + bs);
}

show(67);
show(68);
show(72);

// 运行时的实际正则 source
const I = require('../src/exclusive-trust.js').__internals();
let rt = 0;
const s = I.EXCLUSIVE_EN.source;
for (const ch of s) if (ch === '\\') rt++;
console.log('runtime EXCLUSIVE_EN backslash count = ' + rt);
console.log('runtime source head = ' + JSON.stringify(s.slice(0, 70)));
