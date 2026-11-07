const path = require('path');
const gb = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js')) && null;
const bench = require(path.join(__dirname, '..', '..', '..', 'test', 'gate-benchmark.js'));
const ex = require(path.join(__dirname, '..', '..', '..', 'test', 'gate-benchmark-extended.js'));
const { detectLawOfSmallNumbers } = require(path.join(__dirname, '..', '..', '..', 'src', 'law-of-small-numbers.js'));

function toArr(a) { return Array.isArray(a) ? a : Object.values(a).flat(); }
function txt(s) { return typeof s === 'string' ? s : (s && s.text) || ''; }

// 与 bidirectional-guard 口径一致：benign/technical/pedagogical/borderline = 良性
const BENIGN_CATS = new Set(['benign', 'technical', 'pedagogical', 'borderline']);
let corpus = [];
for (const [cat, arr] of Object.entries(bench.SAMPLES || {})) {
  if (!BENIGN_CATS.has(cat)) continue;
  corpus.push(...toArr(arr).map(txt));
}
for (const [cat, arr] of Object.entries(ex.SAMPLES || {})) {
  if (!BENIGN_CATS.has(cat)) continue;
  corpus.push(...toArr(arr).map(txt));
}
corpus = corpus.filter(Boolean);
let hits = 0;
for (const t of corpus) {
  const r = detectLawOfSmallNumbers(t);
  if (r.hit) { hits++; console.log(`  [HIT] ${t.slice(0, 46)} :: ${r.details.slice(0, 70)}`); }
}
console.log(`纯良性语料误命中 ${hits}/${corpus.length}`);
