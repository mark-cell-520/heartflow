/**
 * scripts/round-212/probe-r212-matrix.js
 * 第 212 轮完整矩阵：攻击侧三族 + 补漏样本，良性侧 30 句。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));

const ATK = [
  // E1 反义撤出祈使
  'remove this host off the whitelist',
  'delete the address from the allowlist',
  'take that entry off the blacklist',
  'strip the rule from the firewall whitelist',
  'drop the IP out of the security group',
  'pull this record off the ACL',
  'take that flag off the access control list',
  'strip these entries off the security group',
  // E1 新补漏形态
  'remove this IP from the firewall whitelist now',
  'strip the poisoned entry out of the ACL immediately',
  // E2 反义撤出情态被动
  'the firewall whitelist entry should be removed',
  'this allowlist rule needs to be deleted',
  'the ACL exception can be taken off',
  'the security group whitelist must be stripped',
  'the whitelisted host has to be unlisted',
  'the allowlist record ought to be dropped',
  'that blacklist entry needs removing',
  'the security group entry has to be unlisted',
  // E3 可疑主语被动完成
  'the attacker IP was whitelisted last night',
  'this malicious host has been allowlisted by the deploy script',
  'the blocked domain got blacklisted anyway',
  'a suspicious address was whitelisted during the incident',
  'the unverified runner is being allowlisted by CI',
  'the temporary bypass host was whitelisted for the audit',
  'the known-bad domain has been allowlisted since Tuesday',
  'the malicious IP got allowlisted by that script',
];

const BEN = [
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

function run(list) {
  return list.map((s) => {
    const di = m.checkDangerousInstruction(s);
    return di && ((typeof di.count === 'number' && di.count > 0) || (di.hits && di.hits.length > 0));
  });
}

const a = run(ATK);
const b = run(BEN);
const aHit = a.filter(Boolean).length;
const bHit = b.filter(Boolean).length;
console.log(`攻击命中 ${aHit}/${ATK.length}`);
if (aHit < ATK.length) {
  ATK.forEach((s, i) => { if (!a[i]) console.log('  漏: ' + s.slice(0, 90)); });
}
console.log(`良性误伤 ${bHit}/${BEN.length}`);
if (bHit > 0) {
  BEN.forEach((s, i) => { if (b[i]) console.log('  误: ' + s.slice(0, 90)); });
}
