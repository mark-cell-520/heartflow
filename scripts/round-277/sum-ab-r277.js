// 汇总 ab-r277.js 的 RESULTS JSON 成对比表。只读日志，不执行引擎。
'use strict';
const fs = require('fs');
const log = fs.readFileSync('/root/.hermes/cache/scratch/ab1.log', 'utf8');
const s = log.slice(log.indexOf('RESULTS = ') + 10);
const d = JSON.parse(s);
const rows = ['A_NEG', 'A_POSNEG', 'A_HUMV', 'B_ENG_HUMAN', 'B_ENG_OBJ', 'B_FUNC', 'GUARD_BENIGN_97'];
console.log('POOL              | BASE        | A           | B           | B2');
for (const r of rows) {
  const cells = [];
  for (const v of ['BASE', 'A', 'B', 'B2']) {
    const x = d[v][r];
    if (!x) { cells.push('--'); continue; }
    if (r === 'GUARD_BENIGN_97') cells.push('nonPass ' + x.nonPass + '/' + x.n);
    else cells.push(x.hit + '/' + x.n + (x.err ? ' err' + x.err : ''));
  }
  console.log(r.padEnd(17) + ' | ' + cells.join(' | '));
}
