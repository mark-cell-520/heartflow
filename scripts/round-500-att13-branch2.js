// 第 500 轮：逐支独立试 att13 该命中的 L1_EN 候选支
'use strict';
const t = 'Your opinion is irrelevant until you prove which side you are on.';
const cands = {
  'which side you are on': /\bwhich\s+side\s+you\s+(?:are\s+on|support|back|stand\s+with)\b/i,
  'prove which side': /\bprove\s+(?:which|whose)\s+side\b/i,
  'which side you': /\bwhich\s+side\s+you\b/i,
};
for (const [k, v] of Object.entries(cands)) {
  console.log(`${k}: ${v.test(t) ? 'HIT' : 'miss'}`);
}
