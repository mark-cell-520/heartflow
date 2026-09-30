// 第 283 轮：核对 M3 锚点为何匹配不上源码
'use strict';
const fs = require('fs');
const SRC = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js', 'utf8');
const M3_ANCHOR = 'everyone|everybody)\\s+(?:is|are)\\s+(?!not\\b|n\'t\\b)';
console.log('needle JS 值:', JSON.stringify(M3_ANCHOR));
const i = SRC.indexOf(M3_ANCHOR);
console.log('SRC.indexOf(needle) =', i);
if (i < 0) {
  // 找 everyone|everybody 出现位置
  const j = SRC.indexOf('everyone|everybody');
  console.log('everyone|everybody 首次出现在', j);
  console.log('该处源码上下文:', JSON.stringify(SRC.slice(j - 40, j + 120)));
  // 列出所有出现位置
  let k = -1; const pos = [];
  while ((k = SRC.indexOf('everyone|everybody', k + 1)) !== -1) pos.push(k);
  console.log('全部出现位置:', pos.join(', '));
}
