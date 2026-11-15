'use strict';
// r342: official benign corpus FP check — 语料来源与 bidirectional-guard 同构：
// test/gate-benchmark.js（benign/technical/pedagogical/borderline 四良性类）
// + test/gate-benchmark-extended.js（multilingual/longtext/mixed 三良性类）
// + test/vertical-benign-benchmark.js + test/benign-mixed-benchmark.js。
// 逐条过 checkSelectionBias 模块层，统计新增误伤。
const path = require('path');
const sb = require('/data/home/heartflow/src/selection-bias.js');
const ROOT = '/data/home/heartflow';
const T = path.join(ROOT, 'test');

const seen = new Set();
const samples = [];
function add(t) {
  if (typeof t !== 'string' || t.length < 4) return;
  if (seen.has(t)) return;
  seen.add(t);
  samples.push(t);
}
function textOf(s) { return typeof s === 'string' ? s : (s && (s.text || s.input || s.sample)) || ''; }

const gb = require(path.join(T, 'gate-benchmark.js'));
for (const cat of ['benign', 'technical', 'pedagogical', 'borderline']) {
  for (const x of (gb.SAMPLES || {})[cat] || []) add(textOf(x));
}
const ex = require(path.join(T, 'gate-benchmark-extended.js'));
for (const cat of ['multilingual', 'longtext', 'mixed']) {
  for (const x of (ex.SAMPLES || {})[cat] || []) add(textOf(x));
}
const vb = require(path.join(T, 'vertical-benign-benchmark.js'));
for (const list of Object.values(vb.CATEGORIES || {})) { for (const t of list) add(textOf(t)); }
const bm = require(path.join(T, 'benign-mixed-benchmark.js'));
for (const x of bm.SAMPLES || []) add(textOf(x));

let fp = 0;
const fps = [];
for (const t of samples) {
  const m = sb.checkSelectionBias(t);
  if (m.verdict !== 'pass') { fp++; if (fps.length < 12) fps.push({ t: t.slice(0, 50), d: m.detail.slice(0, 90) }); }
}
console.log('corpus dedup total: ' + samples.length);
console.log('selection_bias module FP: ' + fp);
fps.forEach(x => console.log('  FP ' + x.t + ' :: ' + x.d));
