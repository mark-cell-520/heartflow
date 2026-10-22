/**
 * scripts/round-209/probe-r209-matrix.js
 * 全量量化：动词 × 设施对象矩阵，找「双词复合设施名 + 窄窗口」缺口。
 * 只报数字，不贴样本（451 纪律）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const arrLit = src.slice(src.indexOf('[', start), end + 2);
const PATS = new Function('"use strict";return ' + arrLit)();

const VERBS = ['truncate', 'reset', 'delete', 'wipe', 'purge', 'clear', 'disable'];
const OBJS = [
  'the security audit log',
  'the security audit logs',
  'the security audit trail',
  'the security audit records',
  'the security event log',
  'the security events log',
  'the security logs',      // 对照：现已被拦
  'the audit log',          // 对照：现已被拦
];

function hit(s) {
  for (const p of PATS) { p.lastIndex = 0; if (p.test(s)) return true; }
  return false;
}

let passCells = 0, total = 0;
const passList = [];
for (const v of VERBS) {
  let row = v.padEnd(9);
  for (const o of OBJS) {
    total++;
    const h = hit(v + ' ' + o);
    if (!h) { passCells++; passList.push(v + ' + ' + o); }
    row += (h ? 'H' : '.').padEnd(4);
  }
  console.log(row);
}
console.log('\npass=' + passCells + '/' + total);
console.log('pass 单元(' + passList.length + '): ' + passList.map(x => x.replace(/ /g, '·')).join(' | '));
console.log('DONE');
