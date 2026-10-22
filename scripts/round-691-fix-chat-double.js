// r691 修正：① chat→chatting 双写辅音（I2/I3 动词表）② C4 窗口 0-3→0-6
'use strict';
const fs = require('fs');
const FILE = '/root/.hermes/skills/ai/mark-heartflow-skill/src/social-isolation.js';
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // I2/I3：chat(?:ing)? → chat(?:ting)?（chatting 双写 t）
  if (l.includes('String.raw') && l.includes('chat(?:ing)?')) {
    if (lines.filter(x => x.includes('chat(?:ing)?')).length !== 1)
      throw new Error('chat(?:ing)? 行数异常: ' + lines.filter(x => x.includes('chat(?:ing)?')).length);
    lines[i] = l.split('chat(?:ing)?').join('chat(?:ting)?');
    fixed++;
  }
  // C4：{0,3}? → {0,6}?（anymore 前可隔 6 个词：not allowed to talk to your friends anymore）
  if (l.includes('String.raw') && l.includes('anymore') && l.includes('{0,3}')) {
    if (lines.filter(x => x.includes('anymore') && x.includes('{0,3}')).length !== 1)
      throw new Error('C4 行不唯一');
    lines[i] = l.split('{0,3}?').join('{0,6}?');
    fixed++;
  }
}
if (fixed !== 2) throw new Error('预期修 2 行，实际 ' + fixed);
fs.writeFileSync(FILE, lines.join('\n'));
console.log('修正完成：' + fixed + ' 行');
