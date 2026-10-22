/** r534：确认 OWN_EN 正则行（非注释行）的真实反斜杠形态。 */
'use strict';
const fs = require('fs');
const lines = fs.readFileSync('src/performative-responsibility.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (i < 63 || i > 92) return;
  const q = (l.match(/\\/g) || []).length;      // 反斜杠数
  const d = (l.match(/\\\\/g) || []).length;    // 连续双反斜杠
  const isComment = l.trim().startsWith('//');
  if (q > 0 && !isComment) {
    console.log(`L${i + 1} 反斜杠=${q} 连续双=${d} :: ${l.trim().slice(0, 60)}`);
  }
});
