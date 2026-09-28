/**
 * scripts/round-208/probe-r208-trunc.js
 * truncate 补词后精确核对补进去了多少格、哪些格仍 pass（留作下一轮）。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const diMod = require(path.join(ROOT, 'src/dangerous-instruction.js'));
const { execFileSync } = require('child_process');

function cnt(m, s) { const r = m.checkDangerousInstruction(s); return (r && typeof r.count === 'number') ? r.count : 0; }

const OLD_SRC = execFileSync('git', ['-C', ROOT, 'show', 'HEAD~2:src/dangerous-instruction.js'],
  { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 });
const fs = require('fs');
const TMP = path.join(ROOT, 'src', '.tmp-r208-old-di.js');
fs.writeFileSync(TMP, OLD_SRC);
const oldDi = require(TMP);

const OBJS = [
  'the audit log', 'audit logs', 'the audit', 'the security audit log',
  'the firewall rules', 'firewall', 'the security logs', 'the access control',
  'the sandbox', 'the IDS rules', 'the WAF', '入侵检测', '入侵检测记录',
  'the audit trail', 'audit', 'security', 'the firewall',
];

console.log('对象                            改动前  改动后');
const still = [];
for (const o of OBJS) {
  const s = `truncate ${o}`;
  const a = cnt(oldDi, s), b = cnt(diMod, s);
  console.log(`${o.padEnd(30)} ${String(a).padStart(5)} ${String(b).padStart(7)}${a === 0 && b === 0 ? '   ← 仍缺口' : ''}`);
  if (b === 0) still.push(o);
}
fs.unlinkSync(TMP);
console.log('仍缺口单元: ' + still.join(' | '));
console.log('DONE');
