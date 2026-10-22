'use strict';
// [r565 diag2] 定位：breakDecl 对后置声明（如 CLAIM_EN）为什么会把
// 后续的 GUARD_ZH 一起吃掉 —— 打印每个变异体的差异区间。
const fs = require('fs');
const src = fs.readFileSync('src/favor-ledger.js', 'utf8');

function breakDecl(src, decl) {
  const start = src.indexOf(`const ${decl} = new RegExp([`);
  const lines = src.slice(start).split('\n');
  let endOffset = start;
  for (let k = 1; k < lines.length; k++) {
    endOffset = start + lines.slice(0, k + 1).join('\n').length;
    if (lines[k].trim() === "].join('|'));") break;
  }
  return { start, endOffset, out: src.slice(0, start) + `const ${decl} = /(?!)ZZ/i;` + src.slice(endOffset) };
}

for (const d of ['LEDGER_ZH', 'LEDGER_EN', 'CLAIM_ZH', 'CLAIM_EN', 'GUARD_ZH', 'GUARD_EN']) {
  const r = breakDecl(src, d);
  const lost = src.slice(r.start, r.endOffset);
  // 被删区间内出现的其它声明名
  const names = ['LEDGER_ZH', 'LEDGER_EN', 'CLAIM_ZH', 'CLAIM_EN', 'GUARD_ZH', 'GUARD_EN']
    .filter(n => n !== d && lost.includes(`const ${n}`));
  const tailOK = r.out.includes('function checkFavorLedger');
  console.log(`${d}: lost ${lost.length} chars, 顺手删掉其他声明 = ${names.length ? names.join(',') : '无'}, checkFavorLedger 还在 = ${tailOK}`);
}
