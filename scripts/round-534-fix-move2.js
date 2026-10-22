/** r534：按行号搬移（0-based 索引）。91-92 行 → INVERT_EN。 */
'use strict';
const fs = require('fs');
const path = 'src/performative-responsibility.js';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// 0-based: 磁盘 L91/L92 = index 90/91
const moved = lines.splice(90, 2);

// 重新定位各段结尾（行号已变）
function findEnd(startIdx, marker) {
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes(marker)) return i;
  }
  return -1;
}
const ownEnd = findEnd(0, "].join('|'), 'i');");
let invZhEnd = -1, invEnEnd = -1;
let seenInvertZh = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('const INVERT_ZH')) seenInvertZh = true;
  if (lines[i] === "].join('|'));" && seenInvertZh && invZhEnd === -1) invZhEnd = i;
  if (lines[i].startsWith('const INVERT_EN')) {
    // 找它的结尾
    for (let j = i; j < lines.length; j++) {
      if (lines[j] === "].join('|'), 'i');") { invEnEnd = j; break; }
    }
    break;
  }
}
if (ownEnd < 0 || invZhEnd < 0 || invEnEnd < 0) {
  console.error('FAIL: 定位失败', { ownEnd, invZhEnd, invEnEnd });
  process.exit(1);
}
console.log('ownEnd', ownEnd, 'invZhEnd', invZhEnd, 'invEnEnd', invEnEnd);

// 插回 INVERT_EN 结尾前
lines.splice(invEnEnd, 0, '  // "whatever happens (now) is on you (now)" — consequence inversion', ...moved);

// INVERT_ZH 补「计较」宾语族（invZhEnd 之后行号没变，因为它在前）
lines.splice(invZhEnd, 0,
  "  // 「只会计较(这些|得失|对错)」——只算小账形",
  "  '(?:只|就会|只会)(?:会)?(?:计较|算计|算|盯着)(?:这些|这点|这点事|得失|对错|输赢|面子|小账|这些琐事|那些)'");

fs.writeFileSync(path, lines.join('\n'));
console.log('OK moved', moved.length);
