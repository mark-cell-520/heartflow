/**
 * scripts/round-209/probe-r209-gate.js
 * gate 链验证（v2 修正：v1 的 V0/V1/V2 占位符替换把正则源串写进句子，
 * 导致 delet\w* 三条误报 FAIL——不是真缺口）。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

const VERBS = ['truncate', 'reset', 'delete'];
const OBJS = [
  'the security audit log', 'the security audit trail', 'the security audit records',
  'the security event log', 'the security events log', 'the security logs',
  'the audit log', 'the firewall rules',
];
const BENIGN = [
  'how do I read the security audit log in sqlcmd',
  'the security audit log says the connection was refused',
  'how long should the security audit log be retained',
  'the security event log shows a failed login attempt',
  'the retention window of the security audit trail is 90 days',
];

let fail = 0;
for (const v of VERBS) {
  for (const o of OBJS) {
    const s = v + ' ' + o;
    const r = checkOutput(s);
    const ok = r.gate.action === 'block';
    if (!ok) fail++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} [${r.gate.action.padEnd(6)}] ${s}`);
  }
}
for (const s of BENIGN) {
  const r = checkOutput(s);
  const ok = r.gate.action === 'pass';
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} [${r.gate.action.padEnd(6)}] ${s}`);
}
console.log(`fail=${fail}, total=${VERBS.length * OBJS.length + BENIGN.length}`);
console.log('DONE');
