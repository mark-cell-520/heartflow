// probe-corpus-r303.js — F-5 新族在全部官方良性语料上的 FP 实测（引擎改后）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const I = require(path.join(ROOT, 'src/average-marginal-conflation.js')).__internals();
const check = require(path.join(ROOT, 'src/average-marginal-conflation.js')).checkAverageMarginalConflation;

function isZh(t) { return /[\u4e00-\u9fff]/.test(t); }
function anyHit(list, text) { for (const re of list) { if (re.test(text)) return true; } return false; }
function f5Legs(t) {
  const zh = isZh(t);
  return {
    l1: anyHit(zh ? I.AVG_RATE_ZH : I.AVG_RATE_EN, t),
    l2: anyHit(zh ? I.RES_ZH.concat(I.MARG_ZH, I.INCR_ZH) : I.RES_EN.concat(I.MARG_EN, I.INCR_EN), t),
    l3: anyHit(zh ? I.QTY_CONCL_ZH : I.QTY_CONCL_EN, t),
  };
}

const corpora = {};
corpora['gate-benchmark'] = require(path.join(ROOT, 'test/gate-benchmark.js')).SAMPLES;
corpora['gate-benchmark-extended'] = require(path.join(ROOT, 'test/gate-benchmark-extended.js')).SAMPLES;
corpora['benign-mixed'] = require(path.join(ROOT, 'test/benign-mixed-benchmark.js')).SAMPLES;
corpora['vertical-benign'] = require(path.join(ROOT, 'test/vertical-benign-benchmark.js')).CATEGORIES;

function flat(v, out) {
  if (typeof v === 'string') { out.push(v); return; }
  if (Array.isArray(v)) { for (const x of v) flat(x, out); return; }
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) {
      if (k === 'text' && typeof v[k] === 'string') { out.push(v[k]); continue; }
      flat(v[k], out);
    }
  }
}

let grandN = 0, grandFP = 0, grandLeg1 = 0, grandLeg12 = 0;
for (const [name, raw] of Object.entries(corpora)) {
  const list = [];
  flat(raw, list);
  let fp = 0, l1 = 0, l12 = 0;
  const hits = [];
  for (const t of list) {
    if (typeof t !== 'string' || t.length < 6) continue;
    grandN++;
    const L = f5Legs(t);
    if (L.l1) { l1++; grandLeg1++; }
    if (L.l1 && L.l2) { l12++; grandLeg12++; }
    if (L.l1 && L.l2 && L.l3) {
      // 完整三腿 → 交给真实检测器（含豁免层）判定
      const r = check(t);
      if (r.hit) { fp++; grandFP++; hits.push(t); }
    }
  }
  console.log(name.padEnd(24) + ' strings=' + String(list.length).padStart(4) +
    '  leg1=' + String(l1).padStart(3) + '  leg1&2=' + String(l12).padStart(3) +
    '  FULL-HIT(含豁免)=' + fp);
  for (const h of hits.slice(0, 8)) console.log('    FP: ' + h.slice(0, 100));
}
console.log('--- TOTAL strings=' + grandN + ' leg1=' + grandLeg1 + ' leg1&2=' + grandLeg12 + ' FULL-FP=' + grandFP);
