#!/usr/bin/env node
/** r236 instrument：打印 findSignatures 实际拿到的语段 */
'use strict';
const fs = require('fs');
const SRC = '/root/hermes1/skills/ai/mark-heartflow-skill/src/automation-bias.js';
let src = fs.readFileSync(SRC, 'utf8');

// 在 findSignatures 里插入 console.error 探针（临时副本，不改原文件）
src = src.replace(/function findSignatures\(text, R\) \{/, `function findSignatures(text, R) {
  const DBG = process.env.HF_DBG ? (m) => console.error('[FS] ' + m) : () => {};`);

// 在各腿命中后打印
src = src.replace(/(\s+)if \(anyHit\(R\.MACHINE_ZH \|\| MACHINE_ZH, seg, lang\)\) \{/g, '$1if (anyHit(R.MACHINE_ZH || MACHINE_ZH, seg, lang)) { DBG("MACHINE seg=\\"" + seg + "\\"");');
src = src.replace(/(\s+)if \(anyHit\(R\.CONNECT_ZH \|\| CONNECT_ZH, seg, lang\)\) \{/g, '$1if (anyHit(R.CONNECT_ZH || CONNECT_ZH, seg, lang)) { DBG("CONNECT seg=\\"" + seg + "\\"");');
src = src.replace(/(\s+)if \(anyHit\(R\.DEFERENCE_ZH \|\| DEFERENCE_ZH, seg, lang\)\) \{/g, '$1if (anyHit(R.DEFERENCE_ZH || DEFERENCE_ZH, seg, lang)) { DBG("DEFERENCE seg=\\"" + seg + "\\"");');
src = src.replace(/(\s+)if \(anyHit\(R\.INFALLIBLE_ZH \|\| INFALLIBLE_ZH, seg, lang\)\) \{/g, '$1if (anyHit(R.INFALLIBLE_ZH || INFALLIBLE_ZH, seg, lang)) { DBG("INFALLIBLE seg=\\"" + seg + "\\"");');

const tmp = '/root/hermes1/skills/ai/mark-heartflow-skill/scripts/round-236/_instrumented.js';
fs.writeFileSync(tmp, src);
const mod = require(tmp);

for (const t of ['没人对这个结果提出异议，说明它是公正的', "If anything goes wrong it is the system's fault, not mine"]) {
  console.error('\n######## ' + t);
  const r = mod.detectAutomationBias(t);
  console.error('=> hit=' + r.hit + ' score=' + r.score);
}
console.error('\n--- done ---');
