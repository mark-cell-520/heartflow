/**
 * scripts/round-665-benign-prewire.js
 *
 * [r665] 接线前良性全集预检：把第 111 维度 conditional_affection 的单维
 * 检测器喂给四个良性基准全集合集，确认误伤为 0 再接进 discriminate()。
 *
 * 口径说明（同 r664，本轮沿用 require 计数口径）：r663 用文本抽取得
 * 390 条，r664 用 require 得 390 条；本轮 require 实测 **378 条**
 * （gate-benchmark 97 + extended 106 + vertical 150 + mixed 25）。
 * 差异来自基准文件自身的样本增删，不是抽取方式。
 */
'use strict';

const path = require('path');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const BENCH_DIR = path.join(HF, 'test');
const { checkConditionalAffection } = require(path.join(HF, 'src/conditional-affection.js'));

const sets = [];
try {
  const gb = require(path.join(BENCH_DIR, 'gate-benchmark.js'));
  for (const cat of Object.keys(gb.SAMPLES || {})) {
    const arr = Array.isArray(gb.SAMPLES[cat]) ? gb.SAMPLES[cat] : [];
    sets.push({ name: 'gate-benchmark.' + cat, samples: arr });
  }
} catch (e) { console.log('[SKIP] gate-benchmark: ' + e.message); }
try {
  const ex = require(path.join(BENCH_DIR, 'gate-benchmark-extended.js'));
  for (const cat of Object.keys(ex.SAMPLES || {})) {
    const arr = Array.isArray(ex.SAMPLES[cat]) ? ex.SAMPLES[cat] : [];
    sets.push({ name: 'extended.' + cat, samples: arr });
  }
} catch (e) { console.log('[SKIP] extended: ' + e.message); }
try {
  const vb = require(path.join(BENCH_DIR, 'vertical-benign-benchmark.js'));
  for (const cat of Object.keys(vb.CATEGORIES || {})) {
    const arr = Array.isArray(vb.CATEGORIES[cat]) ? vb.CATEGORIES[cat] : [];
    sets.push({ name: 'vertical.' + cat, samples: arr });
  }
} catch (e) { console.log('[SKIP] vertical: ' + e.message); }
try {
  const bm = require(path.join(BENCH_DIR, 'benign-mixed-benchmark.js'));
  const arr = Array.isArray(bm.SAMPLES) ? bm.SAMPLES : [];
  sets.push({ name: 'mixed', samples: arr });
} catch (e) { console.log('[SKIP] mixed: ' + e.message); }

let total = 0;
let fp = 0;
const fps = [];
for (const s of sets) {
  let localFp = 0;
  for (const text of s.samples) {
    if (typeof text !== 'string') continue;
    total++;
    if (checkConditionalAffection(text).hit) { fp++; localFp++; if (fps.length < 20) fps.push(s.name + ' :: ' + text.slice(0, 80)); }
  }
  if (s.samples.length) console.log(`${s.name}: ${s.samples.length} 条，误伤 ${localFp}`);
}
console.log(`\n合计 ${total} 条良性，误伤 ${fp}`);
if (fps.length) { console.log('误伤样本:'); fps.forEach(x => console.log('  - ' + x)); }
process.exit(fp === 0 ? 0 : 1);
