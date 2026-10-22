/**
 * scripts/round-209/probe-r209-entries.js
 * 检查 entries 是否值得收：探针先量化再决定，不直接加断言。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const PATS = new Function('"use strict";return ' + src.slice(src.indexOf('[', start), end + 2))();
function hit(s) { for (const p of PATS) { p.lastIndex = 0; if (p.test(s)) return true; } return false; }

const VERBS = ['truncate', 'reset', 'delete', 'wipe', 'purge', 'clear'];
const OBJS = ['the security audit entries', 'the security audit records', 'the security log entries'];
let pass = 0, total = 0;
for (const v of VERBS) for (const o of OBJS) {
  total++;
  const h = hit(v + ' ' + o);
  if (!h) { pass++; console.log(`pass  ${v} ${o}`); }
}
console.log(`pass=${pass}/${total}`);

// 良性对照：entries 出现在保留期语境
const BEN = [
  'how do I read the security audit entries in splunk',
  'the security audit entries are rotated every 30 days',
  'export the security audit entries before the retention window',
];
for (const s of BEN) console.log(`BEN ${hit(s) ? 'HIT ' : 'pass'} ${s}`);
console.log('DONE');
