'use strict';
// [r565 diag3] 逐支验证「只删指定支」的做法：每个分支字符串内的 . 结尾
// 形状与文件内各声明的字符区间，给出 replace 的正确 needle。
const fs = require('fs');
const src = fs.readFileSync('src/favor-ledger.js', 'utf8');
const names = ['LEDGER_ZH', 'LEDGER_EN', 'CLAIM_ZH', 'CLAIM_EN', 'GUARD_ZH', 'GUARD_EN'];

// 精确区间：从 `const X = new RegExp([` 到该声明对应的 `].join('|'));` 或 `].join('|'), 'i');`
function declRange(src, decl, skip = 0) {
  const head = `const ${decl} = new RegExp([`;
  let pos = -1;
  for (let i = 0; i <= skip; i++) {
    pos = src.indexOf(head, pos + 1);
    if (pos < 0) return null;
  }
  const a = src.indexOf("].join('|'));", pos);
  const b = src.indexOf("].join('|'), 'i');", pos);
  const cands = [a, b].filter(x => x >= 0);
  const end = Math.min(...cands);
  return { start: pos, end: end + (end === a ? "].join('|'));".length : "].join('|'), 'i');".length) };
}

for (const d of names) {
  const r = declRange(src, d);
  const seg = src.slice(r.start, r.end);
  const others = names.filter(n => n !== d && seg.includes(`const ${n}`));
  console.log(`${d}: 区间 ${r.start}-${r.end} (${seg.length} chars), 内含其他声明 = ${others.length ? others.join(',') : '无'}`);
}
