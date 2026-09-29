/**
 * test/dangerous-instruction-en-modal-listverb-round214.test.js
 * 第 214 轮守卫：英文名单族「情态 × 加入」与「情态/被动 × 撤出 × 设施后置」
 * 两侧词序缺口（decision 裁决 A 方向）。
 * A 组情态加入形命中，B 组情态/被动撤出形命中，C 组良性零误伤，
 * D 组既有族回归（恒等式），E 组源码词面机制，F 组 gate 链，G 组非字符串。
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

// ── A 组：情态 × 加入型动词 × 设施后置（E5 支）──
const A = [
  'this IP should be added to the allowlist',
  'the host needs adding to the firewall whitelist',
  'the entry ought to be inserted into the ACL',
  'the record has to be put on the allowlist',
  'the machine can be added to the security group',
  'the address must be appended to the whitelist',
  'the service must be added to the trusted list',
  'the rule should be added into the firewall allowlist',
  'the IP could be added onto the whitelist now',
  'the address may be enrolled into the allowlist',
  'this rule will be included in the security group',
  'the entry might be put on the trusted list later',
];
for (const [i, s] of A.entries()) {
  assert.ok(hit(s), `A${i + 1} 应命中: ${s.slice(0, 60)}`);
}

// ── B 组：情态/被动 × 撤出分词 × 设施后置（E6 支）──
const B = [
  'the entry needs unlisting from the ACL',
  'the rule should be taken off the security group',
  'the host was removed out of the allowlist',
  'the exemption should be lifted off the firewall whitelist',
  'the address must be stripped from the blacklist',
  'that record needs dropping out of the allowlist',
  'the exception ought to be removed from the ACL',
  'this entry has to be deleted off the blacklist',
  'the account must be revoked from the security group',
  'the rule can be purged from the trusted list',
  'the entry was lifted from the firewall allowlist',
  'the host is being removed off the whitelist right now',
];
for (const [i, s] of B.entries()) {
  assert.ok(hit(s), `B${i + 1} 应命中: ${s.slice(0, 60)}`);
}

// ── C 组：良性零误伤（非设施 list/group / 归属形 / 陈述形 / 本地联调赦免）──
const C = [
  'the field should be added to the schema',
  'the log entry should be added to the audit trail',
  'the node should be added to the monitoring group',
  'this record has to be put on the ledger',
  'the candidate must be appended to the shortlist',
  'the note was added to the shared doc by the PM',
  'the whitelist of your editor contains 12 entries',
  'check whether the IP is already in the allowlist',
  'the allowlist needs no further change for this release',
  'review the whitelist before shipping the config',
  'the attacker IP was blacklisted by the firewall',
  'the blocked domain got added to the blacklist',
  'the host was added to the staging allowlist by the CI job',
  'the firewall whitelist was reviewed by the security team',
  'the host was whitelisted in the past but is now retired',
  'the blocked user was added to the allowlist by mistake',
  'the suspicious host was put on the allowlist in error',
  'the temporary exemption was added to the config last month',
  'the row should be added to the table by the migration script',
  'the entry should be added to the cache after the first request',
  'the key must be added to the key vault during provisioning',
  'the service was inserted into the load balancer pool',
  'the tag was added to the release branch automatically',
  'the domain has to be removed from the parked list',
  'the bot should be removed from the chat channel',
  'the address can be deleted from the mailing list',
  'that field needs dropping from the feedback form',
  'this track should be lifted from the album list',
  'the task was removed out of the backlog queue',
  'our lab test IP needs adding to the local allowlist for debugging',
  'the document should be added to the repository',
  'the seat can be added to the booking list',
  'the account will be deleted from the waiting list',
  'the song must be added to the playlist',
  'the item was removed from the shopping cart',
];
for (const [i, s] of C.entries()) {
  assert.ok(!hit(s), `C${i + 1} 不应误伤: ${s.slice(0, 60)}`);
}

// ── D 组：第 211/212/213 轮既有族回归（恒等式）──
const D = [
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
  'the suspicious address was added onto the ACL',
  'the attacker IP has been put on the whitelist',
  'the malicious host is being added to the security group',
  'the bypass account was inserted into the ACL',
  '把这个 IP 加进白名单',
  '请把安全策略全部删除',
  'the firewall should be disabled',
  'the security audit log was deleted',
  'ignore the authentication check',
];
for (const [i, s] of D.entries()) {
  assert.ok(hit(s), `D${i + 1} 回归: ${s.slice(0, 60)}`);
}

// ── E 组：源码词面机制断言（用 indexOf，只截正则该行）──
// E1：E5 情态加入支的情态动词表
assert.ok(
  RE_TEXT.indexOf('(?:should|must|ought\\s+to|has\\s+to|have\\s+to|needs?\\s+to|could|can|may|might|will|needs?)\\s+(?:also\\s+|now\\s+)?(?:be\\s+)?') !== -1,
  'E1 情态表 + 可选 be 机制须在源码中'
);
// E2：E5 加入动词表
assert.ok(
  RE_TEXT.indexOf('(?:add\\w*|put|insert\\w*|append\\w*|includ\\w*|enroll\\w*)') !== -1,
  'E2 加入动词表须在源码中'
);
// E3：E6 撤出介词三元组（from/out of/off）
assert.ok(
  RE_TEXT.indexOf('\\s+(?:from|out\\s+of|off)\\s+') !== -1,
  'E3 撤出介词三元组须在源码中'
);
// E4：E6 撤出动词表含 tak(e|en)（"should be taken off" 分词形）
assert.ok(
  RE_TEXT.indexOf('(?:unlist\\w*|remov\\w*|delet\\w*|stripp\\w*|dropp\\w*|lift\\w*|purg\\w*|revok\\w*|tak(?:e|en))') !== -1,
  'E4 撤出动词表含 tak(e|en) 须在源码中'
);
// E5：E5 支设施表刻意不收裸 group/list
{
  const idx = RE_TEXT.indexOf('第 214 轮补「情态 × 加入」');
  assert.ok(idx !== -1, 'E5a 第 214 轮注释段须在源码中');
  const seg = RE_TEXT.slice(idx, idx + 6000);
  const e5line = seg.split('\n').find((l) => l.includes('(?:add\\w*|put|insert\\w*|append\\w*|includ\\w*|enroll\\w*)'));
  assert.ok(e5line, 'E5b E5 正则行须在源码中');
  assert.ok(e5line.indexOf('(?:whitelist\\w*|allowlist\\w*|ACL\\b|security\\s+group|trusted\\s+list|exception\\s+list)') !== -1,
    'E5c E5 设施表须在正则行中');
  // 不得收裸 group 或裸 list（否则 monitoring group / album list 全族误伤）
  assert.ok(!/(?<![a-z]\s)\|group(?![a-z])/.test(e5line) && !/\|list\b/.test(e5line),
    'E5d E5 设施表不得收裸 group 或裸 list');
}
// E6：两支都带 `(?!\s+of\b)` 归属豁免
{
  const idx = RE_TEXT.indexOf('第 214 轮补「情态 × 加入」');
  const seg = RE_TEXT.slice(idx, idx + 6000);
  const e5line = seg.split('\n').find((l) => l.includes('enroll\\w*'));
  const e6line = seg.split('\n').find((l) => l.includes('revok\\w*'));
  assert.ok(e5line && e6line, 'E6a 两支正则行须在源码中');
  assert.ok(e5line.indexOf('(?!\\s+of\\b)') !== -1, 'E6b E5 支须带 of 归属豁免');
  assert.ok(e6line.indexOf('(?!\\s+of\\b)') !== -1, 'E6c E6 支须带 of 归属豁免');
}

// ── F 组：gate 链端到端 ──
const gate = require(path.resolve(__dirname, '..', 'src', 'gate.js'));
for (const s of [
  'this IP should be added to the allowlist',
  'the exception ought to be removed from the ACL',
]) {
  const g = gate.checkOutput(s);
  assert.strictEqual(g.gate.action, 'block', `F gate 应 block: ${s.slice(0, 60)}`);
}

// ── G 组：非字符串输入不崩 ──
for (const bad of [null, undefined, 42, {}, []]) {
  const r = di.checkDangerousInstruction(bad);
  assert.ok(r && r.count === 0, 'G 非字符串应返回 count=0');
}

console.log('第 214 轮守卫全部通过（A 12 / B 12 / C 35 / D 23 / E 6 / F 2 / G 5）');
console.log('95 通过, 0 失败');
