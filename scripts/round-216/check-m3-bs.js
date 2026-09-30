// 第 216 轮：直接打印 BUILT 目标串的 JSON，对比源码行，定位反斜杠数量差
const fs = require('fs');
const c = fs.readFileSync(process.cwd() + '/src/shield/skill-verifier.js', 'utf8');
const line = c.split(String.fromCharCode(10)).find(l => l.includes('u4e00'));
const BS = String.fromCharCode(92);
const Q = String.fromCharCode(34);
for (const n of [1, 2, 3]) {
  const target = '.replace(/[^' + BS.repeat(n) + 'w' + BS.repeat(n) + 'u4e00-' + BS.repeat(n) + 'u9fff-]+/g, ' + Q + Q + ')';
  console.log('n=' + n + ' match=' + line.includes(target) + '  built=' + JSON.stringify(target));
}
console.log('line=' + JSON.stringify(line));
