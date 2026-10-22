/** r534：把 whatever-on-you 两支从 OWN_EN 移到 INVERT_EN，并给 INVERT_ZH 补「计较/算计」宾语族。 */
'use strict';
const fs = require('fs');
const path = 'src/performative-responsibility.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// 1) 从 OWN_EN 摘掉刚误加的两支
const moved = [];
lines = lines.filter(l => {
  if (l.includes("whatever|anything|everything)\\s+(?:that\\s+)?(?:happens") ||
      l.includes("consequences?\\s+(?:are|is)")) { moved.push(l.trim()); return false; }
  return true;
});
// 同时摘掉那一行注释
lines = lines.filter(l => !l.includes('// "whatever happens (now) is on you (now)" — consequence inversion'));

// 2) 找 OWN_EN 结尾（误加前应是 "].join('|'), 'i');"），确认仍完整
const ownEnd = lines.findIndex(l => l === "].join('|'), 'i');");
// 3) 定位 INVERT_EN 结尾行（在 ownEnd 之后的第一个同形态行）
let invEnd = -1;
for (let i = ownEnd + 1; i < lines.length; i++) {
  if (lines[i] === "].join('|'), 'i');") { invEnd = i; break; }
}
if (invEnd === -1) { console.error('FAIL: INVERT_EN 结尾未找到'); process.exit(1); }

const insert = [
  "  // \"whatever happens (now) is on you (now)\" — consequence inversion",
  ...moved,
];
lines.splice(invEnd, 0, ...insert);

// 4) INVERT_ZH 补「计较/算计」宾语族
const invZhEnd = -1;
let zhEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i] === "].join('|'));" && lines[i + 1] === '' && lines[i + 2].startsWith('const INVERT_EN')) { zhEnd = i; break; }
}
if (zhEnd === -1) { console.error('FAIL: INVERT_ZH 结尾未找到'); process.exit(1); }
const zhAdd = [
  "  // 「只会计较(这些|得失|对错)」——只算小账形",
  "  '(?:只|就会|只会)(?:会)?(?:计较|算计|算|盯着)(?:这些|这点|这点事|得失|对错|输赢|面子|小账|这些琐事|那些)'",
];
lines.splice(zhEnd, 0, ...zhAdd);

fs.writeFileSync(path, lines.join('\n'));
console.log('OK: 移动', moved.length, '支; INVERT_EN 行', invEnd, '; INVERT_ZH 行', zhEnd);
