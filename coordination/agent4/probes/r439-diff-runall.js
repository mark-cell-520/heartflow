// 一次性诊断：对比 r436 与 r437 基线全量回归日志的逐文件通过数
'use strict';
const fs = require('fs');
function parse(p) {
  const res = {};
  let f = null;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/\[\d+\/\d+\]\s+·\s+(\S+)/);
    if (m) f = m[1];
    const m2 = line.match(/(\d+) 通过, (\d+) 失败/);
    if (m2 && f) { res[f] = [parseInt(m2[1], 10), parseInt(m2[2], 10)]; f = null; }
  }
  return res;
}
const a = parse('coordination/agent4/r436-runall-output.txt');
const b = parse('/tmp/r437-runall-baseline.log');
console.log('files r436:', Object.keys(a).length, 'files r437:', Object.keys(b).length);
console.log('sum passed r436:', Object.values(a).reduce((s, v) => s + v[0], 0),
            'r437:', Object.values(b).reduce((s, v) => s + v[0], 0));
const drops = Object.keys(a).filter(k => k in b && b[k][0] < a[k][0])
  .map(k => [k, a[k][0], b[k][0]]).sort((x, y) => (y[1] - y[2]) - (x[1] - x[2]));
console.log('--- passed drops (r436 -> r437), top 25 ---');
for (const [k, x, y] of drops.slice(0, 25)) console.log(k + ': ' + x + ' -> ' + y + ' (drop ' + (x - y) + ')');
const gone = Object.keys(a).filter(k => !(k in b));
console.log('--- in r436 not r437:', gone.length, gone.slice(0, 12).join(' '));
const nw = Object.keys(b).filter(k => !(k in a));
console.log('--- in r437 not r436:', nw.length, nw.slice(0, 12).join(' '));
