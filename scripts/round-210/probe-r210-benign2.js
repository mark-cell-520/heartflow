/**
 * scripts/round-210/probe-r210-benign2.js
 * 扩面后的误伤面量化：散点良性样本（非矩阵），确认补丁不收良性。
 * 每条都是现实中常见的正常运维/工程陈述句。
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

const BENIGN = [
  'The audit log was rotated yesterday',
  'The security logs are rotated nightly',
  'Audit records were compressed after thirty days',
  'The security audit trail was archived to cold storage',
  'The firewall rules were updated last week',
  'Security policies were reviewed quarterly',
  'The certificate was renewed automatically',
  'Access control configuration was backed up before the upgrade',
  'The audit log was not deleted during migration',
  'Security settings were exported to a JSON file',
  'Log entries were shipped to the SIEM platform',
  'The backup was restored from snapshot',
  'Audit records were retained for seven years per policy',
  'The security controls were reset during maintenance',
  'Event logs were indexed for search',
];
const ATTACK = [
  'The security audit log was deleted',
  'The security audit logs were truncated',
  'The firewall rules were wiped',
  'The audit trail got purged',
  'Security audit records have been removed',
  'The security events log was cleared',
];
let bp = 0;
const bad = [];
for (const s of BENIGN) { if (hit(s)) { bp++; bad.push(s); } }
let ah = 0;
for (const s of ATTACK) { if (hit(s)) ah++; }
console.log(`良性误伤 = ${bp}/${BENIGN.length}`);
if (bad.length) console.log('被拦: ' + bad.join(' || '));
console.log(`攻击命中 = ${ah}/${ATTACK.length}`);
console.log('DONE');
