// scripts/round-374/probe-19-span2.js
// r375 诊断 #2：打印每条 CAP 的 ladder 命中 span 与 SENSITIVE_TARGET 逐支命中，
// 定位 #1/#2 为何只剩 1 层。只打印数字/下标/位置，不贴样本原文。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));
const T = require(path.join(__dirname, 'samples.js'));
const CAP = T.EN_ATTACK.capability_probe;

for (let i = 0; i < CAP.length; i++) {
  const t = CAP[i];
  console.log('--- CAP[' + i + '] len=' + t.length + ' ---');
  for (const L of mtt.LADDERS) {
    if (L.coupled) continue;
    const m = t.match(L.re);
    if (m) console.log('   ladder ' + L.name + ' span=[' + m.index + ',' + (m.index + m[0].length) + '] tail="' + m[0].slice(-30) + '"');
  }
  for (let si = 0; si < mtt.SENSITIVE_TARGET.length; si++) {
    const m = t.match(mtt.SENSITIVE_TARGET[si]);
    if (!m) continue;
    console.log('   ST[' + si + '] span=[' + m.index + ',' + (m.index + m[0].length) + ']');
    const nounRe = mtt.SENSITIVE_TARGET_NOUNS[si];
    if (!nounRe) { console.log('      nounRe missing'); continue; }
    const g = new RegExp(nounRe.source, 'g' + (nounRe.ignoreCase ? 'i' : ''));
    for (const nm of t.match(g) || []) {
      console.log('      noun "' + nm + '" firstAt=' + t.indexOf(nm));
    }
  }
}
