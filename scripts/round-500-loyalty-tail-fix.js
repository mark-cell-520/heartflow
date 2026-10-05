// 第 500 轮收尾：给 loyalty_test 补最后两支正则（用脚本落盘，避开 patch 转义坑）
// L1_EN 补：which side you ... 直接形
// L2_ZH 已在上一步补齐；本脚本只动 L1_EN 尾部
'use strict';
const fs = require('fs');
const p = '/root/.hermes/skills/ai/mark-heartflow-skill/src/loyalty-test.js';
let s = fs.readFileSync(p, 'utf8');
const before = s;

const oldTail = String.raw`\bnow\s+tell\s+(?:me|us)\s+which\s+side\b/i;`;
const newTail = String.raw`\bnow\s+tell\s+(?:me|us)\s+which\s+side\b|\bwhich\s+side\s+you\s+(?:are\s+on|support|back|stand\s+with)\b|\bdeclare\s+(?:which|whose)\s+side\s+you\b/i;`;

if (!s.includes(oldTail)) {
  console.error('TAIL_NOT_FOUND');
  process.exit(1);
}
s = s.replace(oldTail, newTail);

if (s === before) { console.error('NO_CHANGE'); process.exit(1); }
fs.writeFileSync(p, s);
console.log('PATCHED_L1_EN');
require(p); // 立即验证可加载
console.log('REQUIRE_OK');
const { checkLoyaltyTest } = require(p);
