'use strict';
// r343: official benign corpus FP check — 语料来源与 bidirectional-guard 同构：
// test/gate-benchmark.js（benign/technical/pedagogical/borderline 四良性类）
// + test/gate-benchmark-extended.js（multilingual/longtext/mixed 三良性类）
// + test/vertical-benign-benchmark.js + test/benign-mixed-benchmark.js。
// 逐条过 detectIncentiveBlindSpot（gate 层第 247 维度实际计算函数），
// 统计新增误伤；另单独过 detectIncentiveConflation 定位子族层 FP。
const path = require('path');
const ibs = require('/data/home/heartflow/src/incentive-blind-spot.js');
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

let fp = 0, fpSub = 0;
const fps = [];
for (const t of samples) {
  const m = ibs.detectIncentiveBlindSpot(t);
  if (m && m.hit) {
    fp++;
    if (fps.length < 12) fps.push({ t: t.slice(0, 50), d: (m.detail || '').slice(0, 90), dim: m.dimension });
  }
  const s = ibs.detectIncentiveConflation(t);
  if (s && s.hit) fpSub++;
}
console.log('corpus dedup total: ' + samples.length);
console.log('incentive_blind_spot full-module FP: ' + fp);
console.log('incentive_conflation sub-family FP: ' + fpSub);
fps.forEach(x => console.log('  FP [' + x.dim + '] ' + x.t + ' :: ' + x.d));
