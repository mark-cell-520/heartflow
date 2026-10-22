'use strict';
// [r563] 修过度转义：源文件英文正则字符串字面量里写成了 4 个反斜杠（\\\\），
// 字符串解析后得到 2 个反斜杠字符，正则匹配的是字面 \b 而非单词边界。
// 把 LEDGER_EN / CLAIM_EN / GUARD_EN 三个常量段内的 4 反斜杠降为 2 反斜杠。
const fs = require('fs');
const p = '/root/.hermes/skills/ai/mark-heartflow-skill/src/favor-ledger.js';
let s = fs.readFileSync(p, 'utf8');

const NAMES = ['LEDGER_EN', 'CLAIM_EN', 'GUARD_EN'];
let total = 0;
for (const n of NAMES) {
  const marker = 'const ' + n + ' = new RegExp([';
  const i = s.indexOf(marker);
  if (i < 0) throw new Error('找不到 ' + n);
  const j = s.indexOf('], \'i\');', i);
  if (j < 0) throw new Error(n + ' 找不到收尾');
  const seg = s.slice(i, j);
  const fixed = seg.split('\\\\\\\\').join('\\\\');
  // 统计实际替换量
  total += (seg.match(/\\\\/g) || []).length - (fixed.match(/\\\\/g) || []).length;
  s = s.slice(0, i) + fixed + s.slice(j);
}
fs.writeFileSync(p, s, 'utf8');
console.log('de-escaped backslash pairs:', total);
