/**
 * r231 模块干跑 — automation_bias 对官方良性语料的误报率
 * 语料来源与 scripts/bidirectional-guard.js 完全一致：
 *   benchmarks/gate-benchmark.js（benign/technical/pedagogical/borderline）
 *   benchmarks/gate-benchmark-extended.js（multilingual/longtext/mixed）
 *   benchmarks/vertical-benign-benchmark.js（垂直场景 150）
 *   benchmarks/benign-mixed-benchmark.js（中英混排 25）
 * 同时跑攻击侧召回观察（gate-benchmark malicious + extended adversarial）。
 */
'use strict';
const path = require('path');
const B = '/data/home/heartflow/test/';
const { detectAutomationBias } = require('/data/home/heartflow/src/automation-bias.js');

function toArray(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (typeof src === 'object') return Object.values(src).flat();
  return [];
}
function textOf(s) { return typeof s === 'string' ? s : (s && s.text) || ''; }

const benignSets = [];
{
  const gb = require(B + 'gate-benchmark.js');
  for (const cat of Object.keys(gb.SAMPLES || {})) {
    if (cat === 'malicious') continue;
    benignSets.push(['gb.' + cat, toArray(gb.SAMPLES[cat])]);
  }
  const ex = require(B + 'gate-benchmark-extended.js');
  const src = ex.SAMPLES || {};
  if (Array.isArray(src)) benignSets.push(['ext-flat', src]);
  else for (const [cat, list] of Object.entries(src)) {
    if (cat === 'adversarial') continue;
    benignSets.push(['ext.' + cat, toArray(list)]);
  }
  try {
    const vb = require(B + 'vertical-benign-benchmark.js');
    const vert = [];
    for (const list of Object.values(vb.CATEGORIES || {})) vert.push(...list);
    benignSets.push(['vert-150', vert]);
  } catch (e) { benignSets.push(['vert-150', []]); }
  try { benignSets.push(['mixed-25', toArray(require(B + 'benign-mixed-benchmark.js').SAMPLES)]); } catch (e) { benignSets.push(['mixed-25', []]); }
}

let total = 0, fp = 0;
const fpList = [];
for (const [name, arr] of benignSets) {
  let n = 0, f = 0;
  for (const s of arr) {
    const t = textOf(s);
    if (!t) continue;
    n++; total++;
    const r = detectAutomationBias(t);
    if (r.hit) { f++; fp++; fpList.push({ set: name, text: t.slice(0, 60), detail: r.details.slice(0, 80) }); }
  }
  console.log(`${name}: ${n} 样本, 误报 ${f}`);
}
console.log(`--- 良性合计: ${total} 样本, 模块误报 ${fp} ---`);
for (const x of fpList) console.log('FP | ' + x.set + ' | ' + x.text + ' | ' + x.detail);

// 攻击侧观察（不要求命中，仅记录）
const gb2 = require(B + 'gate-benchmark.js');
const atk = toArray(gb2.SAMPLES.malicious || []);
let a = 0;
for (const s of atk) { const t = textOf(s); if (t && detectAutomationBias(t).hit) a++; }
console.log(`--- 攻击侧观察: gate-97 malicious ${atk.length} 样本, 本模块命中 ${a}（不要求）---`);
