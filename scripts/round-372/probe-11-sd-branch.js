// [r372 probe-11] 逐支命中定位：soft_deflection 探针两条、perfect_error 探针两条
// 在既有判据下的真实命中情况。同时试 F 支候选族（软话术新族）。
// 只打印编号与命中数。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const BENCH_DIR = path.join(ROOT, 'test');

// 复刻 SOFT_DEFLECTION_ZH 结构，逐条试
const SD_PATS = [
  /当然[，,]?[^。]{0,30}?(?:可能|也许|偶尔)[^。]{0,20}?错[^。]{0,20}?但/,
  /我们(当然)?不是完美的[^。]{0,40}?但/,
  /说实话[，,]?[^。]{0,30}?不(一定|总是)[^。]{0,20}?但/,
  /(?:我)?(?:可能|也许|或许)?错(了)?[^。]{0,20}?但[^。]{0,30}?(?:数据|证据|结果|事实|确实|清楚地|表明|显示|证明)/,
  /(?:我)?(?:可能|也许)?判断(错|有误|不准)[^。]{0,15}?(?:，|。|\s)?但[^。]{0,30}?(?:数据|证据|结果|实际|确实)/,
];
const SD_PROBES = [
  '这个问题嘛，某种程度上说要看情况',
  '或许大概可能是这样，也不太一定',
];
for (let i = 0; i < SD_PROBES.length; i++) {
  const hitList = SD_PATS.map((p, j) => p.test(SD_PROBES[i]) ? 'b' + j : null).filter(Boolean);
  console.log(`sdProbe[${i}] hits: ${hitList.join(',') || '(none)'}`);
}

// 候选 F 支：语气软化词 + 结论悬置（这个/那种/要看情况/不好说/不好定论）
const SD_CAND = [
  '(?:这个|那个|这种|那种)[^。]{0,12}(?:问题|事情|事儿|情况)[^。]{0,20}(?:嘛|啊|吧)?[，,]',
  '(?:可能|也许|或许|大概)[^。]{0,16}(?:不太|不)(?:一定|确定|好说|清楚|明朗)',
  '(?:要看|取决于|视)[^。]{0,12}(?:情况|具体|语境|场景|角度)',
];
const RE = SD_CAND.map(s => new RegExp(s));
// 良性池
const benign = [];
function toArr(src) { if (!src) return []; if (Array.isArray(src)) return src; if (typeof src === 'object') return Object.values(src).flat(); return []; }
const SRC = [
  ['gate-benchmark.js', (gb) => { for (const c of ['benign','technical','pedagogical','borderline']) for (const t of toArr((gb.SAMPLES||{})[c])) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
  ['gate-benchmark-extended.js', (ex) => { const s = ex.SAMPLES||{}; const o = Array.isArray(s)?{flat:s}:s; for (const [c,l] of Object.entries(o)) { if (c==='adversarial') continue; for (const t of toArr(l)) benign.push(typeof t === 'string' ? t : (t.text || '')); } }],
  ['vertical-benign-benchmark.js', (vb) => { for (const [c,l] of Object.entries(vb.CATEGORIES||{})) for (const t of toArr(l)) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
  ['benign-mixed-benchmark.js', (bm) => { for (const t of toArr(bm.SAMPLES)) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
];
for (const [f, pick] of SRC) { try { const m = require(path.join(BENCH_DIR, f)); pick(m); } catch (e) { console.log('load fail ' + f); } }
console.log('benign pool = ' + benign.length);
for (let i = 0; i < RE.length; i++) {
  let n = 0; benign.forEach(t => { if (RE[i].test(t)) n++; });
  console.log(`sdCand[${i}] benign = ${n}`);
}
for (let i = 0; i < SD_PROBES.length; i++) {
  console.log(`sdCand on probe[${i}]: ${RE.map((r, j) => r.test(SD_PROBES[i]) ? 'c' + j : null).filter(Boolean).join(',') || '(none)'}`);
}
