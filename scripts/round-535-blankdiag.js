/**
 * r535 诊断：blankDecl 对 EXEMPT_EN 的实际变异片段是否落在正确位置。
 * 用法: node scripts/round-535-blankdiag.js
 */
'use strict';
const fs = require('node:fs');
const origSrc = fs.readFileSync(require.resolve('../src/performative-responsibility.js'), 'utf8');

function blankDecl(declName) {
  return orig => {
    const start = orig.indexOf(`const ${declName} = new RegExp([`);
    if (start < 0) throw new Error('变异目标不存在');
    const m = orig.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
    const after = m ? start + 1 + m.index : orig.length;
    const seg = orig.slice(start, after);
    if (!/new RegExp\(/.test(seg)) throw new Error(`${declName} 声明形状异常`);
    return orig.slice(0, start) +
      `const ${declName} = new RegExp('(?!)');` + orig.slice(after);
  };
}

const mutated = blankDecl('EXEMPT_EN')(origSrc);
const lines = mutated.split('\n');
// 打印变异位置附近 12 行
const idx = lines.findIndex(l => l.includes("const EXEMPT_EN = new RegExp('(?!)');"));
console.log(`EXEMPT_EN 置空出现在第 ${idx + 1} 行（总 ${lines.length} 行）`);
if (idx >= 0) {
  console.log('---- 变异后上下文 ----');
  for (let i = Math.max(0, idx - 2); i <= Math.min(lines.length - 1, idx + 6); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
console.log('---- 原文件中 EXEMPT_EN 上下文 ----');
const origIdx = origSrc.split('\n').findIndex(l => l.includes('const EXEMPT_EN = new RegExp'));
for (let i = origIdx - 1; i <= origIdx + 14 && i < origSrc.split('\n').length; i++) {
  console.log(`${i + 1}: ${origSrc.split('\n')[i]}`);
}
