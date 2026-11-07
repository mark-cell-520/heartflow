#!/usr/bin/env node
/** r236 腿级穿透测试：直接读源码正则表，逐条测命中 */
'use strict';
const fs = require('fs');
const SRC = '/root/hermes1/skills/ai/mark-heartflow-skill/src/automation-bias.js';
const src = fs.readFileSync(SRC, 'utf8');

// 提取四个正则数组字面量并 eval
function extractArr(name) {
  const start = src.indexOf('const ' + name + ' = [');
  if (start < 0) return null;
  const open = src.indexOf('[', start);
  // 找配对的 ]
  let depth = 0, i = open, end = -1;
  while (i < src.length) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
    i++;
  }
  return src.slice(open, end + 1);
}

const TABLES = ['MACHINE_ZH','MACHINE_EN','INFALLIBLE_ZH','INFALLIBLE_EN','DEFERENCE_ZH','DEFERENCE_EN'];
const compiled = {};
for (const t of TABLES) {
  const lit = extractArr(t);
  if (!lit) { console.log('MISSING TABLE', t); continue; }
  try { compiled[t] = eval(lit); } catch (e) { console.log('EVAL FAIL', t, e.message); }
}

const CASES = [
  ['M1-ZH', '没人对这个结果提出异议，说明它是公正的'],
  ['M2-EN', 'It must be right because the algorithm produced it'],
  ['M3-EN', 'No one has objected, so the outcome must be fair'],
  ['M4-EN', "If anything goes wrong it is the system's fault, not mine"],
];

for (const [tag, text] of CASES) {
  console.log('\n=== ' + tag + ' : ' + text);
  for (const t of TABLES) {
    const arr = compiled[t];
    if (!arr) continue;
    const hits = [];
    for (const re of arr) {
      try { const m = text.match(re); if (m) hits.push(m[0]); } catch (e) {}
    }
    console.log('  ' + t.padEnd(16) + (hits.length ? 'HIT ' + JSON.stringify(hits.slice(0,3)) : '----'));
  }
}
