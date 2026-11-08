// r259 官方良性语料干跑：确认新措辞家族不误命中任何良性样本
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const { checkAppealToTradition } = require(path.join(ROOT, 'src', 'appeal-tradition.js'));

function toArray(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return Object.values(v).flat();
  return [v];
}
const sets = [];
const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
sets.push(['gate-benchmark', toArray(gb.SAMPLES || {})]);
const ex = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
for (const [cat, list] of Object.entries(ex.SAMPLES || {})) {
  if (cat === 'adversarial') continue; // 攻击类，不算误伤
  sets.push(['extended-' + cat, toArray(list)]);
}
const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) sets.push(['vertical-' + cat, toArray(list)]);
const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
sets.push(['benign-mixed', toArray(bm.SAMPLES)]);

let total = 0;
let hits = 0;
const offenders = [];
for (const [label, arr] of sets) {
  let n = 0;
  for (const s of arr) {
    const text = typeof s === 'string' ? s : (s && (s.text || s.input || s.content));
    if (typeof text !== 'string' || !text) continue;
    n++; total++;
    const r = checkAppealToTradition(text);
    if (r.hit) { hits++; offenders.push({ label, text: text.slice(0, 60), detail: r.detail }); }
  }
  console.log(label + ' 良性样本 ' + n + ' 条');
}
console.log('──────────────────────────────────────────────');
console.log('合计良性样本 ' + total + ' 条，本族误命中 ' + hits + ' 条');
for (const o of offenders) console.log('  [FP] ' + o.label + ' :: ' + o.text + ' :: ' + o.detail);
