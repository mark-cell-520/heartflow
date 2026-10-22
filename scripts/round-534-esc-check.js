/** r534：检查 OWN_EN 段在磁盘上的真实反斜杠形态（不经 shell 转义）。 */
'use strict';
const fs = require('fs');
const s = fs.readFileSync('src/performative-responsibility.js', 'utf8');
const lines = s.split('\n');
let inOwnEn = false, start = 0, end = 0;
lines.forEach((l, i) => {
  if (l.includes('const OWN_EN')) { inOwnEn = true; start = i; }
  else if (inOwnEn && l.includes("].join('|')")) { end = i; inOwnEn = false; }
});
const seg = lines.slice(start, end + 1).join('\n');
const quadruple = (seg.match(/\\\\/g) || []).length;  // 两个字面反斜杠相邻
const double = (seg.match(/\\/g) || []).length;      // 所有单反斜杠
console.log(`OWN_EN 段: 行 ${start + 1}-${end + 1}, 单反斜杠总数 ${double}, 连续双反斜杠出现 ${quadruple} 次`);
// 实际正则行为
const m = require('../src/performative-responsibility.js');
const i = m.__internals();
console.log('OWN_EN 测试 "You forced my hand":', i.OWN_EN.test('You forced my hand'));
console.log('OWN_EN 测试 "I accept full responsibility":', i.OWN_EN.test('I accept full responsibility'));
console.log('OWN_EN 测试 "my fault":', i.OWN_EN.test('my fault'));
