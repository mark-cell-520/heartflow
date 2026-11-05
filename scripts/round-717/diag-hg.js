'use strict';
// 定位 'Nobody can skip' 命中的 en 判据（一次性诊断）
const fs = require('fs');
const src = fs.readFileSync('C:/Users/USER782663/heartflow-engine/src/index.js', 'utf8');
const start = src.indexOf('HASTY_GENERALIZATION_PATTERNS = {');
const enStart = src.indexOf('en: [', start);
const enEnd = src.indexOf('\n  ],', enStart);
const block = src.slice(enStart, enEnd);
const re = /\/((?:[^/\\]|\\.)+)\/([a-z]*)\s*,/g;
let m, i = 0;
const S = 'Nobody can skip the verification step here.';
while ((m = re.exec(block))) {
  i++;
  try {
    const p = new RegExp(m[1], m[2]);
    if (p.test(S)) console.log('HIT #' + i + ': /' + m[1].slice(0, 90) + '/' + m[2]);
  } catch (e) { /* 跳过非正则字面量 */ }
}
console.log('total en patterns scanned:', i);
