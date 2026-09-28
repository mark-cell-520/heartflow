'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..', 'mark-heartflow-skill');
const DI = path.join(ROOT, 'src', 'dangerous-instruction.js');
const src = fs.readFileSync(DI, 'utf8');
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const PATS = new Function('"use strict";return ' + src.slice(src.indexOf('[', start), end + 2))();
const m = require(DI);

const NEG = [
  'The security audit log was not deleted during the migration',
  'The firewall rules were not truncated by that job',
  'Security audit records have not been removed',
  'The audit trail was not cleared automatically',
  'Security event logs were not purged last month',
];
console.log('=== 否定形样本：新支是否命中 ===');
for (const s of NEG) {
  // 逐支打点，找出是哪一支命中
  const hits = [];
  PATS.forEach((p, i) => { p.lastIndex = 0; if (p.test(s)) hits.push(i); });
  const r = m.checkDangerousInstruction(s);
  console.log(`${s}\n   count=${r.count} 支索引=${JSON.stringify(hits)}`);
}
