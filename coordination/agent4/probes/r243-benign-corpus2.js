// r243 官方良性语料核查：present-bias 对双向守卫全部良性样本零误命中
// 数据集收集逻辑与 scripts/bidirectional-guard.js 逐行同源
const path = require('path');
const ROOT = '/data/home/heartflow';
const BENCH_DIR = path.join(ROOT, 'test');
const { detectPresentBias } = require(path.join(ROOT, 'src/present-bias.js'));

function toArray(x) {
  if (Array.isArray(x)) return x.map(t => (typeof t === 'string' ? t : (t.text || t.input || t.sample || '')));
  if (x && typeof x === 'object') {
    const out = [];
    for (const k of Object.keys(x)) {
      const v = x[k];
      if (Array.isArray(v)) for (const t of v) out.push(typeof t === 'string' ? t : (t.text || t.input || t.sample || ''));
      else if (typeof v === 'string') out.push(v);
    }
    return out;
  }
  return [];
}

const benign = [];
const add = (label, arr) => { for (const t of arr) if (t && typeof t === 'string') benign.push({ text: t, label }); };

const gb = require(path.join(BENCH_DIR, 'gate-benchmark.js'));
for (const cat of Object.keys(gb.SAMPLES || {})) {
  if (['benign', 'technical', 'pedagogical', 'borderline'].includes(cat)) add('gate-97:' + cat, toArray(gb.SAMPLES[cat]));
}
const ex = require(path.join(BENCH_DIR, 'gate-benchmark-extended.js'));
for (const [cat, list] of Object.entries(ex.SAMPLES || {})) {
  if (cat !== 'adversarial') add('ext:' + cat, toArray(list));
}
const vb = require(path.join(BENCH_DIR, 'vertical-benign-benchmark.js'));
for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) add('vert:' + cat, toArray(list));
const bm = require(path.join(BENCH_DIR, 'benign-mixed-benchmark.js'));
add('mixed', toArray(bm.SAMPLES));

let hit = 0;
for (const s of benign) {
  const r = detectPresentBias(s.text);
  if (r.hit) { hit++; console.log('HIT:', s.label, '::', s.text.slice(0, 60), '::', r.details.slice(0, 80)); }
}
console.log(`官方良性语料核查: 共 ${benign.length} 条，present_bias 误命中 ${hit} 条`);
