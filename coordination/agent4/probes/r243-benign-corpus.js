// r243 官方良性语料核查：present-bias 对双向守卫全部良性样本零误命中
const path = require('path');
const fs = require('fs');
const { detectPresentBias } = require('/data/home/heartflow/src/present-bias.js');
const BENCH_DIR = '/data/home/heartflow/test';

// 与 bidirectional-guard.js 同源：主语料 + extended + 垂直 + 混排
const samples = [];
const mainSrc = require(path.join(BENCH_DIR, 'gate-benchmark.js'));
const push = (arr, label) => { for (const s of (arr || [])) samples.push({ text: typeof s === 'string' ? s : (s.text || s.input || s.sample), label }); };
if (Array.isArray(mainSrc)) push(mainSrc, 'main');
else for (const k of Object.keys(mainSrc)) if (Array.isArray(mainSrc[k])) push(mainSrc[k], 'main:' + k);

for (const f of ['gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  try {
    const m = require(path.join(BENCH_DIR, f));
    const arr = Array.isArray(m) ? m : (m.samples || m.benign || m.items || []);
    push(arr, f);
  } catch (e) { console.log('skip', f, e.message); }
}

let total = 0, hit = 0;
const hits = [];
for (const s of samples) {
  if (!s.text || typeof s.text !== 'string') continue;
  total++;
  const r = detectPresentBias(s.text);
  if (r.hit) { hit++; hits.push({ label: s.label, text: s.text.slice(0, 50), detail: r.details }); }
}
console.log(`官方良性语料核查: 共 ${total} 条，present_bias 误命中 ${hit} 条`);
for (const h of hits.slice(0, 20)) console.log('  HIT:', h.label, '::', h.text);
