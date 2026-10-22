'use strict';
// r527 扫描 src/harm-invalidation.js 中正则字符串里的「双重反斜杠」残留
// （源文件里连续两个反斜杠 = 正则里匹配字面反斜杠，会让该支失效）
const fs = require('node:fs');
const path = require('node:path');
const BS = String.fromCharCode(92);
const p = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const lines = fs.readFileSync(p, 'utf8').split('\n');

let total = 0;
lines.forEach((l, i) => {
  // 只在正则定义区（第 59-199 行）扫描
  if (i < 55 || i > 200) return;
  let idx = 0;
  const hits = [];
  for (;;) {
    const j = l.indexOf(BS + BS, idx);
    if (j < 0) break;
    const after = l.slice(j + 2, j + 3);
    hits.push({ pos: j, after });
    idx = j + 2;
  }
  if (hits.length) {
    total += hits.length;
    const ctx = hits.map((h) => `@${h.pos}→${JSON.stringify(l.slice(h.pos, h.pos + 6))}`).join(' ');
    console.log(`L${i + 1} (${hits.length}): ${ctx}`);
  }
});
console.log('双重反斜杠总数 = ' + total);
