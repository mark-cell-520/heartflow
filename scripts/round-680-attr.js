/**
 * scripts/round-680-attr.js
 * [r680] 误拦归因：复刻 bidirectional-guard 的良性集收集逻辑，逐条跑
 * gate.gate()，输出 [{t, a, dims}] JSON 到 stdout。
 * 归因方法：git stash 后跑一次存 HEAD 基线，stash pop 后再跑一次，逐条 diff。
 */
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const BENCH_DIR = path.join(ROOT, 'test');
const gate = require(path.join(ROOT, 'src/gate.js'));

function toArray(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === 'object') return Object.values(x);
  return [];
}
function textOf(s) {
  if (typeof s === 'string') return s;
  if (s && typeof s === 'object') return s.text || s.input || s.prompt || s.content || '';
  return '';
}

const benign = [];
// gate-97 四类（benign/technical/borderline/pedagogical）
try {
  const gb = require(path.join(BENCH_DIR, 'gate-benchmark.js'));
  for (const cat of ['benign', 'technical', 'borderline', 'pedagogical']) {
    for (const s of toArray((gb.SAMPLES || {})[cat] || [])) benign.push(textOf(s));
  }
} catch (e) { console.error('gate-benchmark 加载失败: ' + e.message); }
// extended 三类（multilingual/longtext/mixed）
try {
  const ex = require(path.join(BENCH_DIR, 'gate-benchmark-extended.js'));
  for (const cat of ['multilingual', 'longtext', 'mixed']) {
    for (const s of toArray((ex.SAMPLES || {})[cat] || [])) benign.push(textOf(s));
  }
} catch (e) { console.error('extended 加载失败: ' + e.message); }
// 垂直场景 + 中英混排
try {
  const vb = require(path.join(BENCH_DIR, 'vertical-benign-benchmark.js'));
  for (const list of Object.values(vb.CATEGORIES || {})) for (const t of toArray(list)) benign.push(textOf(t));
} catch (e) { console.error('vertical 加载失败: ' + e.message); }
try {
  const bm = require(path.join(BENCH_DIR, 'benign-mixed-benchmark.js'));
  for (const s of toArray(bm.SAMPLES || [])) benign.push(textOf(s));
} catch (e) { console.error('mixed 加载失败: ' + e.message); }

const out = [];
for (const t of benign) {
  let a = 'ERROR', dims = [];
  try {
    const r = gate.gate(t);
    a = r.gate.action;
    if (Array.isArray(r.trace)) dims = r.trace.filter(x => x && x.dimension && x.dimension !== '_normalization').map(x => x.dimension);
  } catch (e) { a = 'ERROR:' + e.message; }
  out.push({ t, a, dims });
}
// 基准文件 require 时自打印会污染 stdout，结果写文件（路径取 argv[2]）
const outPath = process.argv[2] || '/tmp/attr-out.json';
require('fs').writeFileSync(outPath, JSON.stringify(out));
console.error('written ' + out.length + ' -> ' + outPath);
