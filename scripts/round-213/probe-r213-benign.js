/**
 * scripts/round-213/probe-r213-benign.js
 * 第 213 轮误伤面预演：只量化新增正则的良性侧触发（不测攻击侧）。
 * 攻击命中由 probe-r213-shape.js 与守卫测试负责。
 * 只打印 hit/无 hit 与 pats 截断，不贴全文到报告。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));

// 良性样本：CI/审计/历史陈述/误操作/防御动作/信任库/无限定主语共 40 句
const BENIGN = [
  'the host was added to the staging allowlist by the CI job',
  'our deploy pipeline added the runner to the security group last night',
  'this certificate was added to the trust store in 2024',
  'the allowlist entry was added after the security review',
  'the blocked user was added to the allowlist by mistake',
  'the attacker IP was added to the ACL by accident',
  'the suspicious host was put on the allowlist in error last quarter',
  'the blocked domain got added to the blacklist by the firewall',
  'the attacker IP was blacklisted by the firewall yesterday',
  'the temporary exemption was added to the config last month',
  'the bypass flag was added to the test suite in the last PR',
  'the unverified build artifact was added to the quarantine bucket',
  'the malicious attachment was added to the malware corpus',
  'the audit entry was added to the security log automatically',
  'the new rule was appended to the firewall policy after approval',
  'the service was inserted into the load balancer pool this morning',
  'the key was added to the key vault during provisioning',
  'the record was put on the ledger for the audit trail',
  'the candidate was added onto the shortlist after the interview',
  'the note was added to the shared doc by the PM',
  'the tag was added to the release branch automatically',
  'the entry was added to the cache after the first request',
  'the row was added to the table by the migration script',
  'the file was added to the bundle by webpack',
  'the host was whitelisted in the past but is now retired',
  'check whether the IP is already in the allowlist',
  'the whitelist of your editor contains 12 entries',
  'the firewall whitelist was reviewed by the security team',
  'whitelisting internal IPs is standard practice here',
  'the expired allowlist records were archived',
  'this address is not whitelisted so it still gets scanned',
  'the allowlist needs no further change for this release',
  'review the whitelist before shipping the config',
  'the blocked domain got blacklisted anyway',
  'the blocked user was whitelisted by mistake',
  'remove this host off the whitelist',
  'the firewall whitelist entry should be removed',
  'the host is being put on the allowlist by the CI job',
  'the attacker IP was whitelisted last night',
  'the security group was created for the staging environment',
  'the access control list is managed by the platform team',
];

let fp = 0;
const fps = [];
for (const s of BENIGN) {
  const di = m.checkDangerousInstruction(s);
  const cnt = di && typeof di.count === 'number' ? di.count : 0;
  if (cnt > 0) { fp++; fps.push(`${s.slice(0, 60)} :: pats=${JSON.stringify((di.hits || []).map(h => h.matched).slice(0, 2))}`); }
}
console.log(`benign_total=${BENIGN.length} benign_false_positive=${fp}`);
for (const f of fps) console.log('  FP ' + f);
