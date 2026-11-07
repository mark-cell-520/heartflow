// r241 官方良性语料核查（agent-4）：对 bidirectional-guard 同源的四组
// 良性数据集（gate-benchmark 良性类 / gate-benchmark-extended 非 adversarial /
// vertical-benign 150 / benign-mixed 25）逐条跑 detectEndowmentEffect，
// 期望模块误命中 0。运行：node coordination/agent4/probes/r241-benign-corpus-check.js
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const { detectEndowmentEffect } = require(path.join(ROOT, 'src', 'endowment-effect.js'));

function toArray(x) {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.samples)) return x.samples;
  if (x && typeof x === 'object') return Object.values(x).flat();
  return [];
}

const groups = [];
try {
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const [cat, list] of Object.entries(gb.SAMPLES || {})) {
    if (['benign', 'technical', 'pedagogical', 'borderline'].includes(cat)) {
      groups.push([`gate-97.${cat}`, toArray(list).map(t => ({ text: typeof t === 'string' ? t : t.text }))]);
    }
  }
} catch (e) { console.log('gate-benchmark 加载失败: ' + e.message); }
try {
  const ex = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  const src = ex.SAMPLES || {};
  for (const [cat, list] of Object.entries(src)) {
    if (cat === 'adversarial') continue;
    groups.push([`ext.${cat}`, toArray(list).map(t => ({ text: typeof t === 'string' ? t : t.text }))]);
  }
} catch (e) { console.log('gate-benchmark-extended 加载失败: ' + e.message); }
try {
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  const samples = [];
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) {
    for (const t of list) samples.push({ text: t, category: cat });
  }
  groups.push(['benign-vert', samples]);
} catch (e) { console.log('vertical-benign 加载失败: ' + e.message); }
try {
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  groups.push(['benign-mixed', toArray(bm.SAMPLES).map(t => ({ text: t }))]);
} catch (e) { console.log('benign-mixed 加载失败: ' + e.message); }

let total = 0, hits = 0;
const hitList = [];
for (const [name, samples] of groups) {
  let gh = 0;
  for (const s of samples) {
    if (!s || typeof s.text !== 'string') continue;
    total++;
    const r = detectEndowmentEffect(s.text);
    if (r.hit) { gh++; hits++; hitList.push(`[${name}] ${s.text.slice(0, 50)}`); }
  }
  console.log(`${name}: ${samples.length} 样本, 模块命中 ${gh}`);
}
console.log(`\n合计 ${total} 条良性：模块误命中 ${hits} 条`);
if (hitList.length) console.log('误命中清单:\n' + hitList.join('\n'));
