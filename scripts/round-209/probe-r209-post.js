/**
 * scripts/round-209/probe-r209-post.js
 * 设施在前形（动词在后）缺口量化：the X + verb 语序。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const PATS = new Function('"use strict";return ' + src.slice(src.indexOf('[', start), end + 2))();

const OBJS = [
  'the security audit log', 'the security audit logs', 'the security audit trail',
  'the security audit records', 'the security event log', 'the security events log',
  'the audit log', 'the security logs',
];
const FORMS = [
  v => `${v} it`,            // verb 紧跟（代词）
  v => `was ${v}`,
  v => `needs to be ${v}`,
];
function hit(s) { for (const p of PATS) { p.lastIndex = 0; if (p.test(s)) return true; } return false; }
let pass = 0, total = 0;
const passList = [];
for (const o of OBJS) {
  for (const f of FORMS) {
    const s = `${o} ${f('truncat\\w*')}`;
    total++;
    if (!hit(s)) { pass++; passList.push(`${o} | ${f('VERB')}`); }
  }
}
console.log(`设施在前形（24 格）：pass=${pass}/${total}`);
console.log('pass 单元: ' + passList.join(' || '));
console.log('DONE');
