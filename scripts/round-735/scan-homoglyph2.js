'use strict';
// 只扫「ASCII 形但非 ASCII」的危险字符：零宽 / 全角拉丁 / 西里尔-希腊同形码
const fs = require('fs');
const files = [
  '/data/home/heartflow/src/circular-reasoning.js',
  '/data/home/heartflow/test/round-735-circular-tautology-restate.test.js',
  '/data/home/heartflow/scripts/round-735/diag-legs.js',
  '/data/home/heartflow/scripts/round-735/selftest-module.js',
  '/data/home/heartflow/scripts/round-735/probe-round2.js',
  '/data/home/heartflow/scripts/round-735/debug-enmatch2.js',
  '/data/home/heartflow/scripts/round-735/debug-c4c5.js',
  '/data/home/heartflow/scripts/round-735/debug-miss.js',
  '/data/home/heartflow/scripts/round-735/debug-love.js',
];
const BAD = /[\u200b\u200c\u200d\u2060\ufeff\u00ad\u00a0\uff01-\uff5e\u0370-\u03ff\u0400-\u04ff\u2100-\u214f\u2190-\u21ff]/;
let total = 0;
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const lines = txt.split('\n');
  lines.forEach((ln, i) => {
    const hits = [];
    for (const ch of ln) { if (BAD.test(ch)) hits.push('U+' + ch.codePointAt(0).toString(16)); }
    if (hits.length) { total++; console.log(f.split('/').pop() + ':' + (i + 1) + ' ' + hits.join(' ') + ' | ' + ln.trim().slice(0, 80)); }
  });
}
console.log('合计 ' + total + ' 行含 ASCII 形危险字符');
