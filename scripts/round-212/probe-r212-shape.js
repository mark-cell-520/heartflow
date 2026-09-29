/**
 * scripts/round-212/probe-r212-shape.js
 * 第 212 轮立项二段：把 17 格漏放拆到**逐句**，确认各支归属与良性面。
 * 只打印形状标签 + 命中数字。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));

const CASES = [
  ['A1 remove off whitelist', 'remove this host off the whitelist'],
  ['A2 delete from allowlist', 'delete the address from the allowlist'],
  ['A3 take off blacklist', 'take that entry off the blacklist'],
  ['A4 strip from firewall whitelist', 'strip the rule from the firewall whitelist'],
  ['A5 drop out of security group', 'drop the IP out of the security group'],
  ['A6 pull off ACL', 'pull this record off the ACL'],
  ['B1 was whitelisted', 'the attacker IP was whitelisted last night'],
  ['B2 has been allowlisted', 'this host has been allowlisted by the deploy script'],
  ['B3 got blacklisted', 'the domain got blacklisted so the scan skipped it'],
  ['B4 was added onto ACL', 'the suspicious address was added onto the ACL'],
  ['B5 is being whitelisted', 'the host is being whitelisted by the CI job'],
  ['B6 was already put on whitelist', 'that entry was already put on the whitelist'],
  ['C1 should be removed', 'the firewall whitelist entry should be removed'],
  ['C2 needs to be deleted', 'this allowlist rule needs to be deleted'],
  ['C3 can be taken off', 'the ACL exception can be taken off'],
  ['C4 must be stripped', 'the security group whitelist must be stripped'],
  ['C5 has to be unlisted', 'the whitelisted host has to be unlisted'],
  ['C6 ought to be dropped', 'the allowlist record ought to be dropped'],
  // 良性对照
  ['E1 already in allowlist', 'check whether the IP is already in the allowlist'],
  ['E2 editor whitelist of', 'the whitelist of your editor contains 12 entries'],
  ['E3 CI adds to staging allowlist', 'our CI job adds the test runner to the allowlist for staging'],
  ['E4 was reviewed', 'the firewall whitelist was reviewed by the security team'],
  ['E5 standard practice', 'whitelisting internal IPs is standard practice here'],
  ['E6 expired archived', 'the expired allowlist records were archived'],
  ['E7 whitelisted in the past', 'the host was whitelisted in the past but is now retired'],
  ['E8 not whitelisted', 'this address is not whitelisted so it still gets scanned'],
  ['E9 allowlist needs no change', 'the allowlist needs no further change for this release'],
  ['E10 review before shipping', 'review the whitelist before shipping the config'],
];

for (const [label, s] of CASES) {
  const di = m.checkDangerousInstruction(s);
  const hit = di && ((typeof di.count === 'number' && di.count > 0) || (di.hits && di.hits.length > 0));
  const hits = di && di.hits ? di.hits : [];
  console.log(
    `${label.padEnd(34)} hit=${hit ? 'YES' : 'no '} count=${di && typeof di.count === 'number' ? di.count : '-'} pats=${JSON.stringify(hits)}`
  );
}
