#!/usr/bin/env node
/** r236 诊断 v3：M3 逐腿穿透 + findSignatures 内部路径检查 */
'use strict';
const fs = require('fs');
const SRC = '/root/hermes1/skills/ai/mark-heartflow-skill/src/automation-bias.js';
const src = fs.readFileSync(SRC, 'utf8');

function extractArr(name) {
  const start = src.indexOf('const ' + name + ' = [');
  if (start < 0) return null;
  const open = src.indexOf('[', start);
  let depth = 0, i = open, end = -1;
  while (i < src.length) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
    i++;
  }
  return src.slice(open, end + 1);
}
const T = {};
for (const t of ['MACHINE_EN','INFALLIBLE_EN','DEFERENCE_EN','CONNECT_EN']) {
  T[t] = eval(extractArr(t));
}
const text = 'No one has objected, so the outcome must be fair';
console.log('TEXT:', text);
for (const t of Object.keys(T)) {
  const hits = [];
  for (const re of T[t]) { const m = text.match(re); if (m) hits.push(m[0]); }
  console.log(' ', t.padEnd(15), hits.length ? 'HIT ' + JSON.stringify(hits.slice(0,4)) : '----');
}
// 逐个验证新加正则
console.log('\n--- 新加正则单独验证 ---');
const NEWS = [
  ['MACHINE_EN-D', /\b(?:the|this|that|its|their)\s+(?:outcome|result|results|decision|decisions|score|scores|ranking|rankings|verdict|output|outputs|recommendation|recommendations|assessment|judgment|judgement|ruling|determination)\b/i],
  ['INFALLIBLE_EN-fair', /\b(?:must|has\s+to|should|is)\s+(?:therefore\s+|thus\s+|hence\s+)?(?:be\s+)?(?:fair|valid|reliable|trustworthy|sound|legitimate|authoritative)\b/i],
  ['CONNECT_EN-A', /\bno\s+one\s+has\s+(?:ever\s+)?(?:objected|complained|disputed|questioned|challenged|protested)\b/i],
];
for (const [n, re] of NEWS) console.log(' ', n.padEnd(22), re.test(text) ? 'HIT' : 'MISS');

// 检查 detectAutomationBias 是否有 R 注入默认覆盖
const m = src.match(/function detectAutomationBias[\s\S]{0,900}/);
console.log('\n--- detectAutomationBias 头部 ---\n' + (m ? m[0].slice(0, 900) : 'not found'));
