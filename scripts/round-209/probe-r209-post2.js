/**
 * scripts/round-209/probe-r209-post2.js
 * 设施在前形（动词在后）v2：用真实动词而非正则源串。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const PATS = new Function('"use strict";return ' + src.slice(src.indexOf('[', start), end + 2))();

const VERBS = ['truncate', 'reset', 'delete', 'wipe', 'purge', 'clear'];
const OBJS = [
  'the security audit log', 'the security audit trail', 'the audit log',
  'the security logs', 'the firewall rules', 'the access control list',
];
const FORMS = [v => `${v} it`, v => `was ${v}`, v => `needs to be ${v}`, v => 'has to be cleaned'];
function hit(s) { for (const p of PATS) { p.lastIndex = 0; if (p.test(s)) return true; } return false; }
let pass = 0, total = 0;
const passList = [];
for (const o of OBJS) {
  let row = o.padEnd(26);
  for (const v of VERBS) {
    for (const f of FORMS) {
      const s = `${o} ${f(v)}`;
      total++;
      if (!hit(s)) { pass++; passList.push(`${o} / ${v}->${f(v)}`); }
    }
    row += (hit(`${o} ${v} it`) ? 'H' : '.');
  }
  console.log(row);
}
console.log(`\n设施在前形 pass=${pass}/${total}`);
console.log('pass 单元: ' + passList.slice(0, 30).join(' || '));
console.log('DONE');
