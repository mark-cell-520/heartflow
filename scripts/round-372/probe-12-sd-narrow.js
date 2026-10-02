// [r372 probe-12] 找 sdCand[0] 命中的那条良性，看是什么形状；并试候选 0 的收紧版
// （去掉语气词通道，只保留「这个问题 + 悬置词」）。只打印下标与形状。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const BENCH_DIR = path.join(ROOT, 'test');

const benign = [];
function toArr(src) { if (!src) return []; if (Array.isArray(src)) return src; if (typeof src === 'object') return Object.values(src).flat(); return []; }
const SRC = [
  ['gate-benchmark.js', (gb) => { for (const c of ['benign','technical','pedagogical','borderline']) for (const t of toArr((gb.SAMPLES||{})[c])) benign.push(['gate-'+c, typeof t === 'string' ? t : (t.text || '')]); }],
  ['gate-benchmark-extended.js', (ex) => { const s = ex.SAMPLES||{}; const o = Array.isArray(s)?{flat:s}:s; for (const [c,l] of Object.entries(o)) { if (c==='adversarial') continue; for (const t of toArr(l)) benign.push(['ext-'+c, typeof t === 'string' ? t : (t.text || '')]); } }],
  ['vertical-benign-benchmark.js', (vb) => { for (const [c,l] of Object.entries(vb.CATEGORIES||{})) for (const t of toArr(l)) benign.push(['vert-'+c, typeof t === 'string' ? t : (t.text || '')]); }],
  ['benign-mixed-benchmark.js', (bm) => { for (const t of toArr(bm.SAMPLES)) benign.push(['mixed', typeof t === 'string' ? t : (t.text || '')]); }],
];
for (const [f, pick] of SRC) { try { const m = require(path.join(BENCH_DIR, f)); pick(m); } catch (e) { console.log('load fail ' + f); } }
console.log('benign pool = ' + benign.length);

const C0 = /(?:这个|那个|这种|那种)[^。]{0,12}(?:问题|事情|事儿|情况)[^。]{0,20}(?:嘛|啊|吧)?[，,]/;
const C0N = /(?:这个|那个|这种|那种)(?:问题|事情|事儿|情况)(?:嘛|啊|吧)?[，,]/;
const C0M = /^(?:这个|那个|这种|那种)(?:问题|事情|事儿|情况)(?:嘛|啊|吧)?[，,]/;
const C0H = /(?:这个|那个|这种|那种)(?:问题|事情|事儿|情况)(?:嘛|啊|吧)?[，,][^。\n]{0,24}(?:要看|不好说|不好定论|难说|没法说|说不好|取决于|不一定|不好判断)/;

const PROBES = [
  '这个问题嘛，某种程度上说要看情况',
  '或许大概可能是这样，也不太一定',
];

const ALL = [['C0', C0], ['C0N', C0N], ['C0M', C0M], ['C0H', C0H]];
for (const [name, re] of ALL) {
  let n = 0; const where = [];
  benign.forEach(([src, t], i) => { if (re.test(t)) { n++; where.push(i + ':' + src); } });
  console.log(`${name} benign=${n} ${where.join(' ')}`);
}
for (let i = 0; i < PROBES.length; i++) {
  console.log(`probe[${i}]: ${ALL.map(([n, re]) => (re.test(PROBES[i]) ? n : '')).filter(Boolean).join(',') || '(none)'}`);
}
// 打出那条良性的形状（前 40 字），只读文件本身不贴 stdout 原句亦可
for (const [name, re] of [['C0', C0], ['C0N', C0N], ['C0H', C0H]]) {
  benign.forEach(([src, t]) => { if (re.test(t)) console.log(`${name} FP src=${src} shape=[${t.slice(0, 40)}]`); });
}
