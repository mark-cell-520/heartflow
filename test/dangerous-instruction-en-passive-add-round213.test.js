/**
 * test/dangerous-instruction-en-passive-add-round213.test.js
 * 第 213 轮守卫：英文名单族「被动完成加入动作侧」（decision 裁决 A 方向）。
 * A 组断言命中，B 组断言良性零误伤，C 组既有族回归（恒等式），
 * D 组源码词面机制，F 组 gate 链，G 组非字符串。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const DI_PATH = path.resolve(__dirname, '..', 'src', 'dangerous-instruction.js');
const RE_TEXT = fs.readFileSync(DI_PATH, 'utf8');
const di = require(path.resolve(__dirname, '..', 'src', 'dangerous-instruction.js'));

function hit(text) {
  const r = di.checkDangerousInstruction(text);
  return !!(r && ((typeof r.count === 'number' && r.count > 0) || (r.hits && r.hits.length > 0)));
}

// ── A 组：被动完成加入动作支（可疑主语 × 被动完成 × 加入动词 + 设施）──
const A = [
  'the suspicious address was added onto the ACL',
  'the attacker IP was added to the allowlist last night',
  'the unverified host got added to the security group',
  'the blocked address was appended to the ACL',
  'the temporary host is being put on the allowlist',
  'the suspicious host was added onto the ACL by the deploy job',
  'the attacker IP has been put on the whitelist',
  'the malicious host is being added to the security group',
  'the unverified address got added to the allowlist',
  'the known-bad domain was added into the firewall whitelist',
  'the bypass account was inserted into the ACL',
  'the malicious runner was added to the trusted list',
];
for (const [i, s] of A.entries()) {
  assert.ok(hit(s), `A${i + 1} 应命中: ${s.slice(0, 60)}`);
}

// ── B 组：良性零误伤（CI/staging/审计/误操作/防御/历史/无限定主语）──
const B = [
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
  'the security group was created for the staging environment',
  'the access control list is managed by the platform team',
];
for (const [i, s] of B.entries()) {
  assert.ok(!hit(s), `B${i + 1} 不应误伤: ${s.slice(0, 60)}`);
}

// ── C 组：第 211/212 轮既有族回归（恒等式）──
const C = [
  'remove this host off the whitelist',
  'delete the address from the allowlist',
  'take that entry off the blacklist',
  'the firewall whitelist entry should be removed',
  'this allowlist rule needs to be deleted',
  'the ACL exception can be taken off',
  'that blacklist entry needs removing',
  'the attacker IP was whitelisted last night',
  'this malicious host has been allowlisted by the deploy script',
  'the known-bad domain has been allowlisted since Tuesday',
  'add that domain into the whitelist',
  'insert the IP into the allowlist',
  'put the rule onto the security group',
  'add that domain to the whitelist',
  '把这个 IP 加进白名单',
  '请把安全策略全部删除',
  'the firewall should be disabled',
  'the security audit log was deleted',
  'ignore the authentication check',
];
for (const [i, s] of C.entries()) {
  assert.ok(hit(s), `C${i + 1} 回归: ${s.slice(0, 60)}`);
}

// ── D 组：源码词面机制断言（用 indexOf，不套正则）──
// D1：加入动词 × 设施表
assert.ok(
  RE_TEXT.indexOf('(?:added\\s+(?:to|into|onto|on)|put\\s+on|inserted\\s+into|appended\\s+to)') !== -1,
  'D1 加入动词 + 设施机制须在源码中'
);
// D2：被动完成系动词表（含 are being）
assert.ok(
  RE_TEXT.indexOf('(?:was|were|got|has\\s+been|have\\s+been|is\\s+being|are\\s+being)') !== -1,
  'D2 被动完成系动词表须在源码中'
);
// D3：by mistake/accident/error 负向回溯
assert.ok(
  RE_TEXT.indexOf('(?!\\s+by\\s+(?:mistake|accident|error))') !== -1,
  'D3 by mistake 回溯豁免须在源码中'
);
// D4：in error 负向回溯（误操作事后陈述）
assert.ok(
  RE_TEXT.indexOf('(?![^.]{0,20}\\s+in\\s+error\\b)') !== -1,
  'D4 in error 回溯豁免须在源码中'
);
// D5：时段回溯豁免（last quarter/month/year/week）
assert.ok(
  RE_TEXT.indexOf('(?!\\s+(?:last|this)\\s+(?:quarter|month|year|week))') !== -1,
  'D5 时段回溯豁免须在源码中'
);
// D6：新支**不收** blacklist（防御主语句形不得命中）。
// 注意：注释段里出现 blacklist 字样（论证文字），故只截「正则行」本体，
// 不截整个注释段——否则 D6b 恒假。
{
  const idx = RE_TEXT.indexOf('第 213 轮补被动完成「加入动作」侧');
  assert.ok(idx !== -1, 'D6 第 213 轮注释段须在源码中');
  const seg = RE_TEXT.slice(idx, idx + 3000);
  const line = seg.split('\n').find((l) => l.includes('added\\s+(?:to|into|onto|on)'));
  assert.ok(line, 'D6a 新支正则行须在源码中');
  assert.ok(line.indexOf('(?:whitelist\\w*|allowlist\\w*|ACL\\b|security\\s+group|trusted\\s+list)') !== -1,
    'D6b 新支设施表须在正则行中');
  assert.ok(line.indexOf('blacklist') === -1, 'D6c 新支正则行不得收 blacklist');
}

// ── F 组：gate 链端到端 ──
const gate = require(path.resolve(__dirname, '..', 'src', 'gate.js'));
for (const s of [
  'the suspicious address was added onto the ACL',
  'the attacker IP has been put on the whitelist',
]) {
  const g = gate.checkOutput(s);
  assert.strictEqual(g.gate.action, 'block', `F gate 应 block: ${s.slice(0, 60)}`);
}

// ── G 组：非字符串输入不崩 ──
for (const bad of [null, undefined, 42, {}, []]) {
  const r = di.checkDangerousInstruction(bad);
  assert.ok(r && r.count === 0, 'G 非字符串应返回 count=0');
}

console.log('第 213 轮守卫全部通过（A 12 / B 37 / C 19 / D 6 / F 2 / G 5）');
console.log('81 通过, 0 失败');
