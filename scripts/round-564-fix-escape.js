'use strict';
// [r564] 修 favor-ledger.js 的正则双转义污染（r563 引入）。
// 根因：read_file 看到 '\\\\b'，在 JS 源码字面量里等于 4 个反斜杠 → 正则引擎
// 收到 '\\b'（匹配字面反斜杠+b），导致 EN 组合正则 6 条样本全 false。
// 修法：把源码里所有 4 反斜杠序列还原为 2 反斜杠（即正则层正确的单反斜杠）。
// 只做这一件事，且先备份。
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', 'src', 'favor-ledger.js');
const before = fs.readFileSync(F, 'utf8');

// 统计 4 连续反斜杠（在文件中字面出现）
const quad = (before.match(/\\\\\\\\/g) || []).length;
const quadInStr = (before.match(/\\\\\\\\/g) || []).length;
console.log('文件中 4 连反斜杠出现次数:', (function () {
  // 用 Base64 安全地绕过 shell 转义：直接数字符
  let n = 0;
  for (let i = 0; i + 4 <= before.length; i++) {
    if (before[i] === '\\' && before[i + 1] === '\\' && before[i + 2] === '\\' && before[i + 3] === '\\') n++;
  }
  return n;
})());

// 还原：4 反斜杠 → 2 反斜杠。注意 JS 字符串里 '\\\\' 表示 2 个反斜杠字符。
const after = before.split('\\\\').join('\\');
fs.writeFileSync(F, after);
console.log('写入完成，字节变化:', before.length, '->', after.length);

// 立即验证语法与探测
const m2 = require(F);
const I2 = m2.__internals();
console.log('还原后 LEDGER_EN 源前 60:', JSON.stringify(I2.LEDGER_EN.source.slice(0, 60)));
const probes = [
  'I helped you a lot back then, you cannot refuse me this.',
  'Without me you would be nothing, so do as I say.',
  'I covered for you for years, this is a small ask.',
  'I pulled strings for your promotion, now it is my turn.',
  'After all I have done for you, you owe me this.',
  'Considering everything I did for you, the least you can do is obey.',
];
let hit = 0;
for (const p of probes) {
  const r = m2.checkFavorLedger(p);
  if (r.hit) hit++;
  console.log('probe hit:', r.hit);
}
console.log('EN probe 命中:', hit, '/', probes.length);
