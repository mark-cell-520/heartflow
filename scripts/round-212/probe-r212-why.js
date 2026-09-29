/**
 * scripts/round-212/probe-r212-why.js
 * 第 212 轮：逐支打点，定位 10 条漏放命中了哪条模式、为什么没命中。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');

// 直接读 DANGEROUS_PATTERNS 数组逐条测试（不打点函数）
const src = fs.readFileSync(path.join(ROOT, 'src', 'dangerous-instruction.js'), 'utf8');

const CASES = [
  'drop the IP out of the security group',
  'pull this record off the ACL',
  'take that flag off the access control list',
  'strip these entries off the security group',
  'strip the poisoned entry out of the ACL immediately',
  'the ACL exception can be taken off',
  'the whitelisted host has to be unlisted',
  'the allowlist record ought to be dropped',
  'that blacklist entry needs removing',
  'the security group entry has to be unlisted',
];

// 提取数组内所有正则（按第 212 轮新增三支的行区间）
const e1 = /\b(?:remove|delete|take|strip|drop|pull)\s+(?:this|that|these|the|it|them|any)?[^.]{0,20}\b(?:off|out\s+of|from)\s+(?:the\s+)?(?:firewall\s+|security\s+|access\s+control\s+|ACL\b|security\s+group)?\s*(?:whitelist|allowlist|blacklist)\b(?!\s+of\b)/i;
const e2 = /\b(?:firewall|security|ACL\b|access\s+control|security\s+group)?\s*(?:whitelist|allowlist|blacklist)\b[^.]{0,25}\b(?:should|must|needs?\s+to|has\s+to|can)\s+be\s+(?:remov\w*|delet\w*|stripp\w*|unlist\w*|dropp\w*|taken\s+off)/i;
const e3 = /\b(?:attacker|malicious|suspicious|blocked|known-bad|unverified|temporary)\b[^.]{0,40}\b(?:was|were|got|has\s+been|have\s+been|is\s+being)\s+(?:whitelisted|allowlisted|blacklisted)\b/i;

const NAMES = ['E1 祈使撤出', 'E2 情态撤出', 'E3 可疑主语被动'];
for (const s of CASES) {
  const res = [e1.test(s), e2.test(s), e3.test(s)];
  console.log(`${s.slice(0, 55).padEnd(57)} ${NAMES.filter((_, i) => res[i]).join(',') || '无支命中'}`);
}
console.log('src 中 E1 字样: ' + src.includes('remove|delete|take|strip|drop|pull'));
