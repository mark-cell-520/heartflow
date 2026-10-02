// scripts/round-382/probe-6-strip-anchor.js
// 诊断 strip 还原点为何不命中：打印 re 行前 120 字符的真实转义形态。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const src = fs.readFileSync(path.join(ROOT, 'src/multi-turn-tactics.js'), 'utf8');
for (const key of ['authority_claim', 'peer_pressure', 'responsibility_shift']) {
  const start = src.indexOf(`name: '${key}'`);
  const rest = src.slice(start);
  const next = rest.slice(10).search(/\{\s*name: '/);
  const end = next < 0 ? rest.length : 10 + next;
  const block = src.slice(start, start + end);
  const m = block.match(/re: \/\(\?:[\s\S]*?\/i/);
  if (!m) { console.log(key + ' NO_RE'); continue; }
  const re = m[0];
  console.log(key + ' LEN=' + re.length);
  console.log('  HEAD=' + JSON.stringify(re.slice(0, 60)));
  // 找英文支起点：源码文本里的 |\b
  const idx = re.indexOf('|\\b');
  console.log('  FIRST_EN_PIPE=' + idx + ' ctx=' + JSON.stringify(re.slice(idx, idx + 50)));
  // 试跑 strip 用的正则
  const em = re.match(/\|\\\\b\(\(\?:\)?[a-zA-Z](?:[^|\\n]|\\\\.)*?\\\\b(?=[^(\\n]*?(?:\/i|\||$))/);
  console.log('  STRIP_MATCH=' + (em ? em[0].slice(0, 40) : 'null'));
}
