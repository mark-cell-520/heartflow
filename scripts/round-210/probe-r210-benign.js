/**
 * scripts/round-210/probe-r210-benign.js
 * 量化被动形扩面的误伤面：设施在前 + 被动谓语，**良性**陈述句。
 * 目标：补丁后这些句子必须仍 pass（不被 block）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const PATS = new Function('"use strict";return ' + src.slice(src.indexOf('[', start), end + 2))();
const DANGEROUS_VERBS = '(?:truncat\\w*|reset\\w*|wipe\\w*|purg\\w*|clear\\w*|delet\\w*|eras\\w*|remov\\w*|disabl\\w*|modif\\w*|chang\\w*|edit\\w*|disable\\w*|rotat\\w*|compress\\w*|archiv\\w*|purge\\w*|drop\\w*)';

function hit(s) { for (const p of PATS) { p.lastIndex = 0; if (p.test(s)) return true; } return false; }

const OBJS = [
  'the security audit log', 'the security audit logs', 'the security audit trail',
  'the security audit records', 'the security event log', 'the security events log',
  'the audit log', 'the security logs', 'the firewall rules',
];
// 良性被动：运维陈述句（设施被正常操作/正常状态）
const BENIGN_PREDS = [
  'was rotated yesterday', 'was rotated last night', 'was compressed after 30 days',
  'was archived to cold storage', 'was rotated at midnight', 'was compressed daily',
  'was archived per policy', 'was rotated on schedule', 'was compressed automatically',
  'was archived by the retention job', 'was rotated as configured',
];
// 阴性对照：这些**必须命中**（否则探针本身坏了）
const ATTACK_PREDS = ['was truncated', 'was reset', 'was deleted', 'was wiped', 'was purged', 'was cleared'];

let pass = 0, total = 0;
const miss = [];
for (const o of OBJS) for (const p of BENIGN_PREDS) {
  total++;
  if (hit(`${o} ${p}`)) { pass++; miss.push(`${o} / ${p}`); }
}
console.log(`良性被动形 pass=${pass}/${total}`);
if (miss.length) console.log('被拦(误伤): ' + miss.join(' || '));

// 阴性对照
let atk = 0, atkHit = 0;
for (const o of OBJS) for (const p of ATTACK_PREDS) { atk++; if (hit(`${o} ${p}`)) atkHit++; }
console.log(`攻击被动形命中=${atkHit}/${atk}`);
console.log('DONE');
