// 读取 final-ab-r277.js 的RESULTS JSON 并打印对比。只读日志。
'use strict';
const fs = require('fs');
const log = fs.readFileSync('/root/.hermes/cache/scratch/fab.log', 'utf8');
let s = log.slice(log.indexOf('RESULTS = {') + 10);
// 末尾可能残留 stdout 尾部（例如 MUT_BYTES 行），截到对称大括号
let depth = 0, end = -1;
for (let i = 0; i < s.length; i++) {
  const c = s[i];
  if (c === '{') depth++;
  else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
}
if (end >= 0) s = s.slice(0, end + 1);
const d = JSON.parse(s);
const keys = Object.keys(d.BASE).filter(k => k !== 'GUARD_BENIGN_326' && k !== 'ATTACK_52');
console.log('POOL'.padEnd(18) + 'BASE'.padEnd(22) + 'FINAL');
for (const k of keys) console.log(k.padEnd(18) + d.BASE[k].padEnd(22) + d.FINAL[k]);
console.log('GUARD_BENIGN_326  BASE=' + d.BASE.GUARD_BENIGN_326 + '   FINAL=' + d.FINAL.GUARD_BENIGN_326);
console.log('ATTACK_52         BASE=' + d.BASE.ATTACK_52 + '   FINAL=' + d.FINAL.ATTACK_52);
