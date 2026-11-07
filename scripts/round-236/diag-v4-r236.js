#!/usr/bin/env node
/** r236 诊断 v4：M1/M4 逐腿穿透 + ZH 连接词表检查 */
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
for (const t of ['MACHINE_ZH','INFALLIBLE_ZH','DEFERENCE_ZH','CONNECT_ZH','MACHINE_EN','INFALLIBLE_EN','DEFERENCE_EN','CONNECT_EN']) {
  const lit = extractArr(t);
  T[t] = lit ? eval(lit) : null;
}
const CASES = [
  ['M1-ZH', '没人对这个结果提出异议，说明它是公正的'],
  ['M4-EN', "If anything goes wrong it is the system's fault, not mine"],
];
for (const [tag, text] of CASES) {
  console.log('\n=== ' + tag + ' : ' + text);
  const langs = tag.endsWith('ZH') ? 'ZH' : 'EN';
  for (const leg of ['MACHINE','INFALLIBLE','DEFERENCE','CONNECT']) {
    const t = T[leg + '_' + langs];
    if (!t) { console.log('  ' + leg.padEnd(12), 'NO TABLE'); continue; }
    const hits = [];
    for (const re of t) { const m = text.match(re); if (m) hits.push({ s: m[0], i: m.index }); }
    console.log('  ' + leg.padEnd(12), hits.length ? 'HIT ' + JSON.stringify(hits.slice(0,4)) : '----');
  }
}
// M4 责任转移单独验证
console.log('\n--- RESPONSIBILITY_DELEG_EN 验证 ---');
const rd = extractArr(null);
const m = src.match(/const RESPONSIBILITY_DELEG_EN = ([\s\S]*?);\n/);
if (m) {
  try { const re = eval(m[1]); console.log('  M4-EN:', re.test("If anything goes wrong it is the system's fault, not mine") ? 'HIT' : 'MISS'); }
  catch (e) { console.log('  eval fail', e.message); }
}
