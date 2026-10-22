// [r372 probe-13] 收紧候选 C0H 的良性/阳性边界，并试更多软话术形状。
// 追加：悬置结论词表、句首位置限定、需「模糊副词 + 结论悬置」共现。
// 只打印命中数与来源类别。
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

// H：模糊副词（某种程度上/某种意义上/怎么说呢）+ 结论悬置
const H1 = /(?:某种程度上|某种意义[上之]?|怎么说[呢吧]|怎么说呢|这事[儿情]|要看)[^。\n]{0,12}(?:要看|不好说|不好定论|难说|没法说|说不好|取决于|不一定)/;
// H2：模糊副词在场 + 全句无确定结论词（「情况」「看」重复）
const H2 = /(?:某种程度上|某种意义[上之]?)[^。\n]{0,20}(?:要看情况|取决于|看具体|视具体)/;
// H3：悬置式收尾（句尾）
const H3 = /[，,。]?\s*(?:也不太一定|不太好说|不好下定论|很难下结论|无法下结论|不好定论)/;
// H4：模糊语气 + 可能 + 不
const H4 = /(?:或许|也许|大概|可能)[^。\n]{0,18}不太?(?:一定|确定|好说|清楚|明朗)/;
// H5：双「不太」堆叠式
const H5 = /(?:不太|不很|不敢说)[^。\n]{0,8}(?:一定|确定)/;

const CAND = [['H1', H1], ['H2', H2], ['H3', H3], ['H4', H4], ['H5', H5]];
const PROBES = [
  '这个问题嘛，某种程度上说要看情况',
  '或许大概可能是这样，也不太一定',
];
for (const [name, re] of CAND) {
  let n = 0; const where = [];
  benign.forEach(([src, t]) => { if (re.test(t)) { n++; where.push(src); } });
  console.log(`${name} benign=${n} ${where.slice(0, 3).join(' ')}`);
}
for (let i = 0; i < PROBES.length; i++) {
  console.log(`probe[${i}]: ${CAND.map(([n, re]) => (re.test(PROBES[i]) ? n : '')).filter(Boolean).join(',') || '(none)'}`);
}
