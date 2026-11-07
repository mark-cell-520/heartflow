'use strict';
// r239 误拦面核查：按 bidirectional-guard.js 同口径加载全部良性集，
// 直接用新模块 detectIllusionOfControl 跑（模块未接线，引擎门禁看不到它）
const path = require('path');
const BENCH_DIR = '/data/home/heartflow/test';
const { detectIllusionOfControl } = require('/data/home/heartflow/src/illusion-of-control.js');

function toArray(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (typeof src === 'object') return Object.values(src).flat();
  return [];
}
function textOf(s) { return typeof s === 'string' ? s : (s && s.text) || ''; }

const sets = {};
const gb = require(path.join(BENCH_DIR, 'gate-benchmark.js'));
for (const cat of Object.keys(gb.SAMPLES || {})) {
  const samples = toArray(gb.SAMPLES[cat]);
  if (samples.length === 0) continue;
  if (cat === 'malicious') continue;
  sets[`gate-97.${cat}`] = samples;
}
const ex = require(path.join(BENCH_DIR, 'gate-benchmark-extended.js'));
for (const [cat, list] of Object.entries(ex.SAMPLES || {})) {
  if (cat === 'adversarial') continue;
  const arr = toArray(list);
  if (arr.length) sets[`ext.${cat}`] = arr;
}
const vb = require(path.join(BENCH_DIR, 'vertical-benign-benchmark.js'));
{
  const samples = [];
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) for (const t of list) samples.push({ text: t, category: cat });
  sets['benign-vert'] = samples;
}
const bm = require(path.join(BENCH_DIR, 'benign-mixed-benchmark.js'));
sets['benign-mixed'] = toArray(bm.SAMPLES).map(t => ({ text: t }));

let total = 0, hit = 0;
const hitItems = [];
for (const [name, samples] of Object.entries(sets)) {
  let sHit = 0;
  for (const s of samples) {
    const text = textOf(s);
    if (!text) continue;
    total++;
    const m = detectIllusionOfControl(text);
    if (m.hit) { sHit++; hit++; hitItems.push({ set: name, cat: s.category || '', text }); }
  }
  console.log(`${name}: ${samples.length} 样本, 模块命中 ${sHit}`);
}
console.log(`\n合计 ${total} 条良性：模块误命中 ${hit} 条`);
for (const h of hitItems) console.log(`  [${h.set}${h.cat ? '/' + h.cat : ''}] ${h.text.slice(0, 70)}`);
