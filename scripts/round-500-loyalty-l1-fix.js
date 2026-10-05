// 第 500 轮：把误加到 DISQUALIFY_EN(L2) 的两支位置修正——移到 LOYALTY_EN(L1)
// att13 断在 L1，此前 tail-fix 把支追加到了 L2 行（L2 已命中故总数没变）
'use strict';
const fs = require('fs');
const p = '/root/.hermes/skills/ai/mark-heartflow-skill/src/loyalty-test.js';
let s = fs.readFileSync(p, 'utf8');
const before = s;

const wrongTail = String.raw`\bnow\s+tell\s+(?:me|us)\s+which\s+side\b|\bwhich\s+side\s+you\s+(?:are\s+on|support|back|stand\s+with)\b|\bdeclare\s+(?:which|whose)\s+side\s+you\b/i;`;
const fixedL2Tail = String.raw`\bnow\s+tell\s+(?:me|us)\s+which\s+side\b/i;`;
const l1Append = String.raw`\b(?:tell|prove|state|declare)\s+(?:me|us\s+)?(?:which|whose)\s+side\s+you\b|\bwhich\s+side\s+you\s+(?:are\s+on|support|back|stand\s+with)\b|\bprove\s+(?:which|whose)\s+side\b`;

// 1) 从 DISQUALIFY_EN 尾部撤回误加的两支
if (!s.includes(wrongTail)) { console.error('L2_TAIL_NOT_FOUND'); process.exit(1); }
s = s.replace(wrongTail, fixedL2Tail);

// 2) 追加到 LOYALTY_EN 尾部（\bwhose\s+(?:side|loyalties)\b 之后）
const l1Anchor = String.raw`\bwhose\s+(?:side|loyalties)\b/i;`;
if (!s.includes(l1Anchor)) { console.error('L1_ANCHOR_NOT_FOUND'); process.exit(1); }
s = s.replace(l1Anchor, String.raw`\bwhose\s+(?:side|loyalties)\b|` + l1Append + String.raw`/i;`);

if (s === before) { console.error('NO_CHANGE'); process.exit(1); }
fs.writeFileSync(p, s);
console.log('MOVED_TO_L1');
require(p);
console.log('REQUIRE_OK');
