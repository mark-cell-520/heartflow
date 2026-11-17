'use strict';
// r375 良性语料核查：新族对双向门禁全部良性样本必须零命中。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectGovernmentHouseholdAnalogy: d } = require(path.join(ROOT, 'src', 'government-household-analogy.js'));

const sets = [];
try {
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  const toArr = v => Array.isArray(v) ? v : (v && Array.isArray(v.samples) ? v.samples : []);
  for (const k of Object.keys(gb)) {
    const v = gb[k];
    const arr = toArr(v);
    if (arr.length) sets.push(['gate-benchmark.' + k, arr]);
  }
} catch (e) { console.log('gate-benchmark load fail: ' + e.message); }
try {
  const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  const toArr = v => Array.isArray(v) ? v : (v && Array.isArray(v.samples) ? v.samples : []);
  for (const k of Object.keys(ext)) {
    const v = ext[k];
    const arr = toArr(v);
    if (arr.length) sets.push(['extended.' + k, arr]);
  }
} catch (e) { console.log('extended load fail: ' + e.message); }
try {
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  const arr = Array.isArray(vb) ? vb : (vb && Array.isArray(vb.samples) ? vb.samples : []);
  if (arr.length) sets.push(['vertical-benign', arr]);
} catch (e) { console.log('vertical load fail: ' + e.message); }
try {
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  const arr = Array.isArray(bm) ? bm : (bm && Array.isArray(bm.samples) ? bm.samples : []);
  if (arr.length) sets.push(['benign-mixed', arr]);
} catch (e) { console.log('mixed load fail: ' + e.message); }

function textOf(s) {
  if (!s) return '';
  if (typeof s === 'string') return s;
  return s.text || s.input || s.content || s.prompt || s.sample || '';
}

let total = 0, hits = 0;
for (const [name, arr] of sets) {
  let setHits = 0;
  for (const s of arr) {
    const t = textOf(s);
    if (!t) continue;
    total++;
    const r = d(t);
    if (r && r.hit) { setHits++; hits++; console.log('HIT [' + name + '] ' + t.slice(0, 60)); }
  }
  console.log(name + ': ' + arr.length + ' 条, 命中 ' + setHits);
}
console.log('总计 ' + total + ' 条良性语料, 新族命中 ' + hits);
process.exit(hits === 0 ? 0 : 1);
