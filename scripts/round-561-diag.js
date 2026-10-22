'use strict';
// 诊断：为什么「我从来没用出过问题，所以这套流程是安全的」在 gate 层是 pass
// 而模块级 checkAnecdoteAsProof 命中。逐层查：原文 vs 归一化文本。
const path = require('path');
const HF = require('../src/index.js');
const mod = require('../src/anecdote-as-proof.js');

const TEXT = '我从来没用出过问题，所以这套流程是安全的。';

// 1) 原文走模块
console.log('模块(原文):', JSON.stringify(mod.checkAnecdoteAsProof(TEXT)));

// 2) gate 全链路
try {
  const r = HF.gate(TEXT);
  console.log('gate.action:', r.gate.action, '| verdict:', r.verdict);
  console.log('findings:', JSON.stringify((r.findings || []).map(f => ({ d: f.dimension, s: f.severity }))));
  console.log('checked_by:', JSON.stringify(r.checked_by));
} catch (e) {
  console.log('gate THREW:', e.message);
}

// 3) 归一化后走模块
let norm = null;
try {
  const n = require('../src/core/normalize.js');
  norm = (n && (n.normalize || n.normalizeText || n.default)) ? (n.normalize || n.normalizeText || n.default)(TEXT) : null;
} catch (e) { norm = 'ERR ' + e.message; }
console.log('归一化文本:', typeof norm === 'string' ? norm : String(norm));
if (typeof norm === 'string') {
  console.log('模块(归一化):', JSON.stringify(mod.checkAnecdoteAsProof(norm)));
}

// 4) 逐支测试哪支腿命中
const i = mod.__internals();
console.log('ANECDOTE_ZH 命中:', i.ANECDOTE_ZH.test(TEXT));
console.log('UNIVERSAL_ZH 命中:', i.UNIVERSAL_ZH.test(TEXT));
console.log('SELF_LIMIT_ZH 命中:', i.SELF_LIMIT_ZH.test(TEXT));
console.log('ADVICE_GUARD 命中:', i.ADVICE_GUARD.test(TEXT));
