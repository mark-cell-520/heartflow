// r345 probe-4：逐函数 dump 真实返回结构（有的函数返回字符串而非 {count}）。
// 目的：判定 0 是真漏判还是字段名不匹配。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src/index.js'));

const CASES = {
  contradiction: ['我完全支持环保，不过每天开车浪费资源', '我完全支持环保，但我每天都浪费资源'],
  reasoning_coherence: ['今天下雨了，股票会涨', '因为今天下雨，所以股票会涨'],
  bad_faith: ['我早就知道，只是当时没说', '现在的成绩完全是我预料之中的，毫无悬念'],
  pseudo_causal: ['他成功就是因为他每天都早起', '他成功了因为他每天都早起'],
  tone_policing: ['你这么情绪化，我们没法讨论', '你这么情绪化，没法好好讨论'],
};

const FNS = {
  contradiction: 'checkContradiction',
  reasoning_coherence: 'checkReasoningCoherence',
  bad_faith: 'checkBadFaith',
  pseudo_causal: 'checkPseudoCausal',
  tone_policing: 'checkTonePolicing',
};

for (const [dim, fn] of Object.entries(FNS)) {
  console.log('=== ' + dim + ' / ' + fn + ' typeof=' + (typeof idx[fn]));
  if (typeof idx[fn] !== 'function') continue;
  for (const s of CASES[dim]) {
    let out;
    try { out = idx[fn](s); } catch (e) { out = 'ERR:' + e.message; }
    console.log('  -> ' + JSON.stringify(out).slice(0, 400));
  }
}
