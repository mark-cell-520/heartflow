'use strict';
// 扫描文件里的「看起来像 ASCII 但实际不是」的可疑字符（零宽/同形异码/全角）
const fs = require('fs');
const files = [
  '/data/home/heartflow/src/circular-reasoning.js',
  '/data/home/heartflow/test/round-735-circular-tautology-restate.test.js',
  '/data/home/heartflow/scripts/round-735/diag-legs.js',
  '/data/home/heartflow/scripts/round-735/selftest-module.js',
  '/data/home/heartflow/scripts/round-735/probe-round2.js',
];
const SUSPECT = /[\u200b\u200c\u200d\u2060\ufeff\u00a0\u3000\uff41-\uff5a\uff21-\uff3a\u0370-\u03ff\u0400-\u04ff\u2010-\u2015\u2028\u2029\u00ad]/;
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let n = 0;
  lines.forEach((ln, i) => {
    const hits = [];
    for (const ch of ln) {
      const cp = ch.codePointAt(0);
      if (cp > 0x7f) {
        if (SUSPECT.test(ch) || (cp >= 0xff00 && cp <= 0xffef)) hits.push('U+' + cp.toString(16) + '(' + ch + ')');
      }
    }
    if (hits.length) { n++; console.log(f.split('/').pop() + ':' + (i + 1) + ' ' + hits.join(' ')); }
  });
  console.log(f.split('/').pop() + ': ' + n + ' 行含可疑字符');
}
