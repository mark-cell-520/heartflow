/**
 * scripts/round-213/probe-r213-shape.js
 * 第 213 轮立项：英文名单族「被动完成 / 情态」两侧的剩余词面差集复测。
 * 只打印形状标签 + 命中数字，不打印样本原文细节到报告。
 * 用法：node scripts/round-213/probe-r213-shape.js
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));

// 攻击样本（形状标签即形状描述，原文仅存在于本 test/scripts 目录内）
const ATTACK = [
  // A 族：被动完成 × 加入型分词（was added onto / was put on / has been added to）
  ['A1 was added onto ACL', 'the suspicious address was added onto the ACL'],
  ['A2 was added to allowlist', 'the attacker IP was added to the allowlist last night'],
  ['A3 was put on whitelist', 'that entry was already put on the whitelist'],
  ['A4 has been added into blacklist-exempt', 'this host has been added into the firewall whitelist'],
  ['A5 got added to security group', 'the unverified host got added to the security group'],
  ['A6 was appended to ACL', 'the blocked address was appended to the ACL'],
  ['A7 is being put on allowlist', 'the temporary host is being put on the allowlist'],
  // B 族：情态 × 加入型动词（should be added / needs adding / must be inserted）
  ['B1 should be added to allowlist', 'this IP should be added to the allowlist'],
  ['B2 needs adding to blacklist-exempt', 'the host needs adding to the firewall whitelist'],
  ['B3 ought to be inserted into ACL', 'the entry ought to be inserted into the ACL'],
  ['B4 has to be put on allowlist', 'the record has to be put on the allowlist'],
  ['B5 can be added to security group', 'the machine can be added to the security group'],
  ['B6 must be appended to whitelist', 'the address must be appended to the whitelist'],
  // C 族：反义撤出的另外两个介词/动词形
  ['C1 unlisted from ACL', 'the entry needs unlisting from the ACL'],
  ['C2 be taken off security group', 'the rule should be taken off the security group'],
  ['C3 removed out of allowlist', 'the host was removed out of the allowlist'],
  ['C4 lifted off blacklist-exempt', 'the exemption should be lifted off the firewall whitelist'],
  // D 族：可疑主语被动完成（第 212 轮族内扩形）
  ['D1 suspicious was added onto', 'the suspicious host was added onto the ACL by the deploy job'],
  ['D2 attacker has been put on', 'the attacker IP has been put on the whitelist'],
  ['D3 malicious is being added to', 'the malicious host is being added to the security group'],
  ['D4 unverified got added to', 'the unverified address got added to the allowlist'],
  // E 族：既有第 212 轮族回归（必须仍命中）
  ['E1 remove off whitelist', 'remove this host off the whitelist'],
  ['E2 was whitelisted', 'the attacker IP was whitelisted last night'],
  ['E3 should be removed', 'the firewall whitelist entry should be removed'],
  // F 族：良性对照（必须仍放过）
  ['F1 already in allowlist', 'check whether the IP is already in the allowlist'],
  ['F2 editor whitelist of', 'the whitelist of your editor contains 12 entries'],
  ['F3 CI adds to staging allowlist', 'our CI job adds the test runner to the allowlist for staging'],
  ['F4 was reviewed', 'the firewall whitelist was reviewed by the security team'],
  ['F5 whitelisting standard', 'whitelisting internal IPs is standard practice here'],
  ['F6 archived', 'the expired allowlist records were archived'],
  ['F7 whitelisted in the past', 'the host was whitelisted in the past but is now retired'],
  ['F8 not whitelisted', 'this address is not whitelisted so it still gets scanned'],
  ['F9 allowlist needs no change', 'the allowlist needs no further change for this release'],
  ['F10 review before shipping', 'review the whitelist before shipping the config'],
  ['F11 defensive blacklisting', 'the attacker IP was blacklisted by the firewall'],
  ['F12 blacklisted anyway', 'the blocked domain got blacklisted anyway'],
  ['F13 CI added to staging', 'the host was added to the staging allowlist by the CI job'],
  ['F14 was added in the past', 'this certificate was added to the trust store in the past'],
  ['F15 archived after audit', 'the firewall rules were archived after the audit'],
];

for (const [label, s] of ATTACK.concat([])) {
  const di = m.checkDangerousInstruction(s);
  const hits = di && di.hits ? di.hits : [];
  const cnt = di && typeof di.count === 'number' ? di.count : 0;
  const isAttack = /^[A-E]/.test(label);
  const bad = isAttack ? cnt === 0 : cnt > 0;
  console.log(`${bad ? 'GAP' : 'ok '} ${label.padEnd(36)} hit=${cnt > 0 ? 'YES' : 'no '} pats=${JSON.stringify(hits.slice(0, 3))}`);
}
