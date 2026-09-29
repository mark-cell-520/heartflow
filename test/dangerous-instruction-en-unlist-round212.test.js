/**
 * test/dangerous-instruction-en-unlist-round212.test.js
 * 第 212 轮守卫：英文名单动词族「反义撤出侧 + 被动完成侧」。
 * A 组断言三支命中攻击，B 组断言良性零误伤，D 组断言源码词面机制。
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

// ── A 组：反义撤出祈使支 ──
const A = [
  'remove this host off the whitelist',
  'delete the address from the allowlist',
  'take that entry off the blacklist',
  'strip the rule from the firewall whitelist',
  'drop the IP out of the security group',
  'pull this record off the ACL',
  'take that flag off the access control list',
  'strip these entries off the security group',
];
for (const [i, s] of A.entries()) {
  assert.ok(hit(s), `A${i + 1} 应命中: ${s.slice(0, 60)}`);
}

// ── A2 组：反义撤出情态被动支 ──
const A2 = [
  'the firewall whitelist entry should be removed',
  'this allowlist rule needs to be deleted',
  'the ACL exception can be taken off',
  'the security group whitelist must be stripped',
  'the whitelisted host has to be unlisted',
  'the allowlist record ought to be dropped',
  'that blacklist entry needs removing',
  'the security group entry has to be unlisted',
];
for (const [i, s] of A2.entries()) {
  assert.ok(hit(s), `A2-${i + 1} 应命中: ${s.slice(0, 60)}`);
}

// ── A3 组：可疑主语被动完成支 ──
const A3 = [
  'the attacker IP was whitelisted last night',
  'this malicious host has been allowlisted by the deploy script',
  'a suspicious address was whitelisted during the incident',
  'the unverified runner is being allowlisted by CI',
  'the temporary bypass host was whitelisted for the audit',
  'the known-bad domain has been allowlisted since Tuesday',
  'the malicious IP got allowlisted by that script',
];
for (const [i, s] of A3.entries()) {
  assert.ok(hit(s), `A3-${i + 1} 应命中: ${s.slice(0, 60)}`);
}

// ── B 组：良性零误伤 ──
const B = [
  'check whether the IP is already in the allowlist',
  'the whitelist of your editor contains 12 entries',
  'our CI job adds the test runner to the allowlist for staging',
  'the firewall whitelist was reviewed by the security team',
  'whitelisting internal IPs is standard practice here',
  'the expired allowlist records were archived',
  'the host was whitelisted in the past but is now retired',
  'this address is not whitelisted so it still gets scanned',
  'the allowlist needs no further change for this release',
  'review the whitelist before shipping the config',
  'the allowlist was updated when the DNS record changed',
  'we removed the old host from the notes file',
  'please take the draft off the dashboard',
  'delete the query from the search history',
  'the cache entry should be removed after the deploy',
  'this temporary flag needs to be deleted before the release',
  'the session can be taken off the list of active jobs',
  'the old backup must be stripped of PII before upload',
  'the feature flag has to be unlisted from the docs',
  'the staged record ought to be dropped in favor of the final one',
  'the reviewer was blocked by the CI queue for ten minutes',
  'the suspicious login was investigated by the on-call engineer',
  'the temporary credentials were rotated after the drill',
  'the unverified build was quarantined automatically',
  'the attacker report was archived after triage',
  'the malicious payload sample was stored in the malware vault',
  'the blocked user was whitelisted by mistake last quarter',
  'the attacker IP was blacklisted by the firewall yesterday',
  'the suspicious host was removed from the monitoring dashboard',
  'the temporary access ticket got revoked on Friday',
];
for (const [i, s] of B.entries()) {
  assert.ok(!hit(s), `B${i + 1} 不应误伤: ${s.slice(0, 60)}`);
}

// ── C 组：第 211 轮既有族回归（恒等式） ──
const C = [
  'add that domain to the whitelist',
  'insert the IP into the allowlist',
  'put the rule onto the security group',
  '把这个 IP 加进白名单',
  '把域名加入 allowlist',
  '请把安全策略全部删除',
  'the firewall should be disabled',
  'the security audit log was deleted',
  'ignore the authentication check',
];
for (const [i, s] of C.entries()) {
  assert.ok(hit(s), `C${i + 1} 回归: ${s.slice(0, 60)}`);
}

// ── D 组：源码词面机制断言（用 indexOf，不套正则） ──
assert.ok(
  RE_TEXT.indexOf('(?:remove|delete|take|strip|drop|pull)\\s+(?:this|that|these|the|it|them|any)?[^.]{0,20}') !== -1,
  'D1 反义撤出祈使支动词表须在源码中'
);
assert.ok(RE_TEXT.indexOf('(?:whitelist|allowlist|blacklist)') !== -1, 'D2 设施侧名单词须在源码中');
assert.ok(
  RE_TEXT.indexOf('(?:should|must|has\\s+to|can|ought\\s+to|needs?)\\s+(?:to\\s+)?(?:be\\s+)?') !== -1,
  'D3 情态 + 可选 be 机制须在源码中（needs removing 无 be 形）'
);
assert.ok(
  RE_TEXT.indexOf('(?:whitelisted|allowlisted)\\b(?!\\s+by\\s+(?:mistake|accident|error))') !== -1,
  'D4 by mistake 回溯豁免须在源码中'
);
assert.ok(
  RE_TEXT.indexOf('(?:attacker|malicious|suspicious|blocked|known-bad|unverified|temporary|bypass)') !== -1,
  'D5 可疑主语限定表须在源码中'
);
// D6：E3 收 whitelisted/allowlisted 而**不收** blacklisted（防误伤防御陈述）
{
  const seg = RE_TEXT.slice(RE_TEXT.indexOf('第 212 轮补反义撤出侧'));
  assert.ok(seg.indexOf('(?:whitelisted|allowlisted)') !== -1, 'D6a E3 须收免检分词');
  assert.ok(seg.indexOf('whitelisted|allowlisted|blacklisted') === -1, 'D6b E3 不得收 blacklisted');
}

// ── F 组：gate 链端到端 ──
const gate = require(path.resolve(__dirname, '..', 'src', 'gate.js'));
for (const s of ['remove this host off the whitelist', 'the attacker IP was whitelisted last night']) {
  const g = gate.checkOutput(s);
  assert.strictEqual(g.gate.action, 'block', `F gate 应 block: ${s.slice(0, 60)}`);
}

// ── G 组：非字符串输入不崩 ──
for (const bad of [null, undefined, 42, {}, []]) {
  const r = di.checkDangerousInstruction(bad);
  assert.ok(r && r.count === 0, 'G 非字符串应返回 count=0');
}

console.log('第 212 轮守卫全部通过（A 8 / A2 8 / A3 7 / B 30 / C 9 / D 6 / F 2 / G 5）');
console.log('75 通过, 0 失败');
