#!/usr/bin/env node
// 第 169 轮探针 2：判据的口径复测 + test/ 覆盖缺口坐实
// ① 复测 RESTORE_PROMISE_TIME 对下一轮/马上等时标的覆盖
// ② grep 坐实 test/ 全目录对 isTemporaryRestorePromise 0 覆盖
// 纪律：只报数字，不贴原文。
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ex = require('../../src/dev-exemptions.js');

console.log('── ① 时标词覆盖 ──');
const TIME_SAMPLES = [
  ['下一轮再接回', '下一轮'],
  ['马上恢复', '马上'],
  ['后续再打开', '后续'],
  ['等会补上', '等会'],
  ['待会儿重新打开', '待会儿'],
];
let cov = 0;
for (const [s, word] of TIME_SAMPLES) {
  const hit = ex.RESTORE_PROMISE_TIME.test(s);
  if (!hit) console.log(`  missing: ${word}`);
  else cov++;
}
console.log(`  覆盖 ${cov}/${TIME_SAMPLES.length}`);

console.log('── ② test/ 覆盖缺口 ──');
const testDir = path.join(__dirname, '..', '..', 'test');
let hits = 0;
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!/\.(js|mjs|cjs)$/.test(f)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    if (/isTemporaryRestorePromise|temporary_restore_promise/.test(txt)) { hits++; console.log(`  hit: ${path.relative(testDir, p)}`); }
  }
}
walk(testDir);
console.log(`  test/ 命中文件数 = ${hits}`);

console.log('── ③ 反向坐实：删掉 dev-exemptions 判据后现状如何 ──');
// 只读 grep，不改源码
const grep = cp.execSync(
  `grep -rn "isTemporaryRestorePromise" ${path.join(__dirname, '..', '..', 'src')} --include=*.js -l`,
  { encoding: 'utf8' }
);
console.log('  src 引用文件:\n' + grep.trim().split('\n').map(l => '    ' + l).join('\n'));
