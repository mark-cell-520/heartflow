/**
 * r256 模块层干跑：对官方良性语料全量跑 detectFundamentalAttributionError，
 * 统计误命中。语料来源与 bidirectional-guard.js 一致：
 *   benchmark/gate-benchmark.js（benign/technical 严格组 + 其余宽松组）
 *   benchmark/gate-benchmark-extended.js（multilingual/longtext/mixed）
 *   benchmark/vertical-benign-benchmark.js（垂直场景 150）
 *   benchmark/benign-mixed-benchmark.js（中英混排 25）
 */
const path = require('path');
const fs = require('fs');
const ROOT = '/data/home/heartflow';
const BENCH_DIR = path.join(ROOT, 'test');
const { detectFundamentalAttributionError } = require(path.join(ROOT, 'src', 'fundamental-attribution-error.js'));

function toArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.map(t => (typeof t === 'string' ? t : (t && t.text) || ''));
  if (typeof x === 'object') {
    const out = [];
    for (const v of Object.values(x)) out.push(...toArray(v));
    return out;
  }
  return [];
}

const sets = {};
function load(name, file, pick) {
  try {
    const m = require(path.join(BENCH_DIR, file));
    sets[name] = pick(m);
  } catch (e) { sets[name] = { error: e.message }; }
}

load('gate-97', 'gate-benchmark.js', m => {
  const out = [];
  for (const [cat, list] of Object.entries(m.SAMPLES || {})) {
    if (['benign', 'technical', 'borderline', 'pedagogical'].includes(cat)) {
      for (const t of toArray(list)) out.push({ text: t, cat });
    }
  }
  return out;
});
load('ext', 'gate-benchmark-extended.js', m => {
  const out = [];
  const src = m.SAMPLES || {};
  for (const [cat, list] of Object.entries(src)) {
    if (cat === 'adversarial') continue;
    for (const t of toArray(list)) out.push({ text: t, cat });
  }
  return out;
});
load('vert', 'vertical-benign-benchmark.js', m => {
  const out = [];
  for (const [cat, list] of Object.entries(m.CATEGORIES || {})) {
    for (const t of toArray(list)) out.push({ text: t, cat });
  }
  return out;
});
load('mixed', 'benign-mixed-benchmark.js', m => toArray(m.SAMPLES).map(t => ({ text: t, cat: 'mixed' })));

let grandTotal = 0, grandHit = 0;
for (const [name, s] of Object.entries(sets)) {
  if (s.error) { console.log(`[${name}] 加载失败: ${s.error}`); continue; }
  let hit = 0;
  const hits = [];
  for (const { text, cat } of s) {
    if (!text) continue;
    grandTotal++;
    let r;
    try { r = detectFundamentalAttributionError(text, null); } catch (e) { hits.push({ text, cat, err: e.message }); hit++; continue; }
    if (r && r.hit) { hit++; hits.push({ text, cat, ev: r.evidence[0] }); }
  }
  grandHit += hit;
  console.log(`[${name}] 样本 ${s.length} 条：误命中 ${hit}`);
  for (const h of hits.slice(0, 20)) console.log('    ×', (h.cat || '?'), '|', String(h.text).slice(0, 46), '|', h.err || h.ev || '');
}
console.log(`\n合计：官方良性语料 ${grandTotal} 条，误命中 ${grandHit}`);
