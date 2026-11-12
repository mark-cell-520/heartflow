/* scripts/round-301/fix-needles-r301.js — 把测试文件里 CHASE_EN 注入 needle 的多层反斜杠修正为单层（只改测试文件） */
const path = require('path');
const fs = require('fs');
const f = path.join(__dirname, '..', '..', 'test', 'round-301-law-of-averages.test.js');
let s = fs.readFileSync(f, 'utf8');
const before = s;
// 目标：needle 的 JS 字符串值为单反斜杠（源正则里 \s 单反斜杠）→ 文件里 2 个反斜杠
const fixes = [
  ["cutRe(G.CHASE_EN, 'double\\\\\\\\s+(?:the|my|your|our)\\\\\\\\s+(?:bet|stake|wager)')",
   "cutRe(G.CHASE_EN, 'double\\\\s+(?:the|my|your|our)\\\\s+(?:bet|stake|wager)')"],
  ["cutRe(G.CHASE_EN, 'raise\\\\\\\\s+the\\\\\\\\s+(?:bet|stake|stakes)')",
   "cutRe(G.CHASE_EN, 'raise\\\\s+the\\\\s+(?:bet|stake|stakes)')"],
  ["cutRe(G.LLN_EN, 'over\\\\\\\\s+time')", "cutRe(G.LLN_EN, 'over\\\\s+time')"],
  ["cutRe(G.LLN_EN, 'with\\\\\\\\s+more\\\\\\\\s+(?:trials|trades|rounds|bets|flips|games|data)')",
   "cutRe(G.LLN_EN, 'with\\\\s+more\\\\s+(?:trials|trades|rounds|bets|flips|games|data)')"],
  ["cutRe(G.LLN_EN, 'law\\\\\\\\s+of\\\\\\\\s+averages')", "cutRe(G.LLN_EN, 'law\\\\s+of\\\\s+averages')"],
];
let n = 0;
for (const [a, b] of fixes) {
  if (s.includes(a)) { s = s.split(a).join(b); n++; }
  else console.log('NOT FOUND: ' + a.slice(0, 60));
}
if (n > 0) { fs.writeFileSync(f, s); }
console.log('fixed ' + n + '/' + fixes.length + ' needles; file changed: ' + (s !== before));
