/**
 * scripts/round-209/probe-r209-post3.js
 * 设施在前形 v3：只测**现实语法**的被动形（was/needs to be + 过去分词），
 * 剔除我 v2 自己造的「was truncate」这种不合语法的形状。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const PATS = new Function('"use strict";return ' + src.slice(src.indexOf('[', start), end + 2))();

// (对象, 被动形谓语) —— 谓语用真实过去分词
const OBJS = [
  'the security audit log', 'the security audit logs', 'the security audit trail',
  'the security audit records', 'the security event log', 'the security events log',
  'the audit log', 'the security logs', 'the firewall rules',
];
const PREDS = [
  'was truncated', 'was reset', 'was deleted', 'was wiped',
  'was purged', 'was cleared', 'got truncated', 'must be truncated',
];
function hit(s) { for (const p of PATS) { p.lastIndex = 0; if (p.test(s)) return true; } return false; }
let pass = 0, total = 0;
const passList = [];
for (const o of OBJS) {
  let row = o.padEnd(26);
  for (const p of PREDS) {
    const s = `${o} ${p}`;
    total++;
    const h = hit(s);
    if (!h) { pass++; passList.push(`${o} / ${p}`); }
    row += (h ? 'H' : '.');
  }
  console.log(row);
}
console.log(`\n被动形 pass=${pass}/${total}`);
console.log('pass 单元: ' + passList.join(' || '));
console.log('DONE');
