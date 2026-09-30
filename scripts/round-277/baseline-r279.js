// 第 279 轮：门禁良性基线口径核对（与 bidirectional-guard.js 同口径）。
// 输出 nonPass / hastyFp 两个数字。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
function load() {
  const out = [];
  const toA = (s) => (Array.isArray(s) ? s : (s && typeof s === 'object' ? Object.values(s).flat() : []));
  const tx = (s) => (typeof s === 'string' ? s : (s && s.text) || '');
  const gb = require(path.join(__dirname, '..', '..', 'test', 'gate-benchmark.js'));
  for (const c of ['benign', 'technical', 'borderline', 'pedagogical']) for (const s of toA(gb.SAMPLES[c])) { const t = tx(s); if (t) out.push(t); }
  const ex = require(path.join(__dirname, '..', '..', 'test', 'gate-benchmark-extended.js'));
  for (const c of ['multilingual', 'longtext', 'mixed']) for (const s of toA(ex.SAMPLES[c])) { const t = tx(s); if (t) out.push(t); }
  const vb = require(path.join(__dirname, '..', '..', 'test', 'vertical-benign-benchmark.js'));
  for (const l of Object.values(vb.CATEGORIES || {})) for (const s of l) { const t = tx(s); if (t) out.push(t); }
  const bm = require(path.join(__dirname, '..', '..', 'test', 'benign-mixed-benchmark.js'));
  for (const s of toA(bm.SAMPLES)) { const t = tx(s); if (t) out.push(t); }
  return out;
}
const g = load();
let n = 0, h = 0;
for (const t of g) {
  const r = gate.checkOutput(t);
  const a = r && r.gate ? r.gate.action : 'none';
  if (a !== 'pass' && a !== 'none') { n++; if ((r.findings || []).some(f => f.dimension === 'hasty_generalization')) h++; }
}
console.log('BENIGN_TOTAL=' + g.length);
console.log('BENIGN_NONPASS=' + n);
console.log('BENIGN_HASTY_FP=' + h);
