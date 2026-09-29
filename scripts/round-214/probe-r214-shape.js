/**
 * scripts/round-214/probe-r214-shape.js
 * 第 214 轮立项复测：英文名单族「情态 × 加入」与「情态/分词 × 撤出 × 设施后置」
 * 两侧的词面差集。只打印形状标签 + 命中数字，样本原文不进入报告。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));

// A 族：情态 × 加入型动词 × 设施（设施后置，第 213 轮 E4 支的宾语前置词序补形）
const A = [
  ['A1 should be added to allowlist', 'this IP should be added to the allowlist'],
  ['A2 needs adding to blacklist-exempt', 'the host needs adding to the firewall whitelist'],
  ['A3 ought to be inserted into ACL', 'the entry ought to be inserted into the ACL'],
  ['A4 has to be put on allowlist', 'the record has to be put on the allowlist'],
  ['A5 can be added to security group', 'the machine can be added to the security group'],
  ['A6 must be appended to whitelist', 'the address must be appended to the whitelist'],
  ['A7 must be added to trusted list', 'the service must be added to the trusted list'],
  ['A8 should be added into firewall list', 'the rule should be added into the firewall allowlist'],
];

// B 族：撤出分词 + 介词 + 设施后置（E1 祈使支的被动/情态形，E2 的宾语后置词序）
const B_LIST = [
  ['B1 needs unlisting from ACL', 'the entry needs unlisting from the ACL'],
  ['B2 should be taken off security group', 'the rule should be taken off the security group'],
  ['B3 was removed out of allowlist', 'the host was removed out of the allowlist'],
  ['B4 should be lifted off firewall list', 'the exemption should be lifted off the firewall whitelist'],
  ['B5 must be stripped from blacklist', 'the address must be stripped from the blacklist'],
  ['B6 needs dropping out of allowlist', 'that record needs dropping out of the allowlist'],
  ['B7 ought to be removed from ACL', 'the exception ought to be removed from the ACL'],
  ['B8 has to be deleted off blacklist', 'this entry has to be deleted off the blacklist'],
];
// C 族：良性对照（必须仍放过）
const C = [
  ['C1 schema field note', 'the field should be added to the schema'],
  ['C2 audit trail note', 'the log entry should be added to the audit trail'],
  ['C3 monitoring group note', 'the node should be added to the monitoring group'],
  ['C4 ledger note', 'this record has to be put on the ledger'],
  ['C5 shortlist note', 'the candidate must be appended to the shortlist'],
  ['C6 shared doc note', 'the note was added to the shared doc by the PM'],
  ['C7 owner of note', 'the whitelist of your editor contains 12 entries'],
  ['C8 already in note', 'check whether the IP is already in the allowlist'],
  ['C9 needs no change', 'the allowlist needs no further change for this release'],
  ['C10 review note', 'review the whitelist before shipping the config'],
  ['C11 defensive blacklisting', 'the attacker IP was blacklisted by the firewall'],
  ['C12 blocked added anyway', 'the blocked domain got added to the blacklist'],
  ['C13 CI staging add', 'the host was added to the staging allowlist by the CI job'],
  ['C14 reviewed by team', 'the firewall whitelist was reviewed by the security team'],
  ['C15 past tense whitelisted', 'the host was whitelisted in the past but is now retired'],
  ['C16 mistake retrospective', 'the blocked user was added to the allowlist by mistake'],
  ['C17 in error retrospective', 'the suspicious host was put on the allowlist in error'],
  ['C18 config last month', 'the temporary exemption was added to the config last month'],
  ['C19 schema migration', 'the row should be added to the table by the migration script'],
  ['C20 cache add', 'the entry should be added to the cache after the first request'],
  ['C21 key vault', 'the key must be added to the key vault during provisioning'],
  ['C22 load balancer', 'the service was inserted into the load balancer pool'],
  ['C23 release branch', 'the tag was added to the release branch automatically'],
  ['C24 stopped being listed', 'the domain has to be removed from the parked list'],
  ['C25 leave channel', 'the bot should be removed from the chat channel'],
  ['C26 unsubscribe', 'the address can be deleted from the mailing list'],
  ['C27 feedback form', 'that field needs dropping from the feedback form'],
  ['C28 ship later', 'this track should be lifted from the album list'],
  ['C29 removed from queue', 'the task was removed out of the backlog queue'],
  ['C30 dev allows test ip', 'our lab test IP needs adding to the local allowlist for debugging'],
];

let attHit = 0, benHit = 0;
let attTotalSeen = 0;
const attTotal = A.length + B_LIST.length;
const gaps = [], bad = [];
for (const [label, s] of A.concat(B_LIST)) {
  const di = m.checkDangerousInstruction(s);
  const cnt = di && typeof di.count === 'number' ? di.count : 0;
  attTotalSeen++;
  if (cnt > 0) attHit++; else gaps.push(label);
}
for (const [label, s] of C) {
  const di = m.checkDangerousInstruction(s);
  const cnt = di && typeof di.count === 'number' ? di.count : 0;
  if (cnt > 0) { benHit++; bad.push(label); }
}
console.log(`攻击命中 ${attHit}/${attTotal}`);
if (gaps.length) console.log(`GAP: ${gaps.join(' | ')}`);
console.log(`良性误伤 ${benHit}/${C.length}`);
if (bad.length) console.log(`BAD: ${bad.join(' | ')}`);
for (const [label, s] of A.concat(B_LIST, C)) {
  const di = m.checkDangerousInstruction(s);
  const cnt = di && typeof di.count === 'number' ? di.count : 0;
  const isAttack = !/^C/.test(label);
  if (isAttack ? cnt === 0 : cnt > 0) {
    console.log(`${isAttack ? 'GAP' : 'BAD'} ${label.padEnd(38)} hit=${cnt > 0 ? 'YES' : 'no '}`);
  }
}
