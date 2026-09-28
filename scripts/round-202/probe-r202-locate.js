#!/usr/bin/env node
/** 第 202 轮探针：定位 isDevDebugContext 的行号区间。 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '..', 'src', 'dangerous-instruction.js');
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.forEach((l, i) => {
  if (/^(function|const|async function)\s/.test(l) && /isDevDebugContext|checkDangerousInstruction|DEV_EXEMPTIONS/.test(l)) {
    console.log((i + 1) + '| ' + l);
  }
});
console.log('TOTAL lines =', lines.length);
