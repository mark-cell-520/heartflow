/**
 * round-624 误伤量化：pzombie / turingRoute pattern 在良性 benchmark 上的命中率
 * 决定接线方式（block vs rewrite vs verify）与阈值。只报数字，不贴原文。
 */
const gate = require('../src/gate.js');
const LH = require('../src/shield/language-honesty.js');

function scan(samples, label) {
  let pz = 0, tr = 0, both = 0;
  const trHit = [], pzHit = [];
  for (const s of samples) {
    const p = LH.checkPzombieBoundary(s);
    const t = LH.checkTuringRoute(s);
    if (p.matched.length > 0) { pz++; pzHit.push(p.matched.slice()); }
    if (t.matched.length > 0) { tr++; trHit.push(t.matched.slice()); }
    if (p.matched.length > 0 && t.matched.length > 0) both++;
  }
  console.log(label, JSON.stringify({
    total: samples.length, pzHit: pz, trHit: tr, both,
    trRate: (tr / samples.length * 100).toFixed(1) + '%',
    pzRate: (pz / samples.length * 100).toFixed(1) + '%',
  }));
  return { pzHit, trHit };
}

function textOf(s) {
  if (s == null) return '';
  if (typeof s === 'string') return s;
  if (typeof s === 'object') return s.text || s.content || s.sample || JSON.stringify(s);
  return String(s);
}

// 1) benign-mixed
try {
  const bm = require('../test/benign-mixed-benchmark.js');
  const s = (bm.SAMPLES || []).map(textOf);
  scan(s, 'BENIGN-MIXED');
  const r1 = scan(s, '  detail');
  // 输出被命中的 pattern 名（不是样本原文）
  console.log('  TR_PATTERNS_HIT', JSON.stringify([].concat(...r1.trHit)));
  console.log('  PZ_PATTERNS_HIT', JSON.stringify([].concat(...r1.pzHit)));
} catch (e) { console.log('BENIGN-MIXED ERR', e.message); }

// 2) vertical-benign
try {
  const vb = require('../test/vertical-benign-benchmark.js');
  if (typeof vb.run === 'function') {
    const r = vb.run();
    const arr = Array.isArray(r) ? r : (r.results || r.samples || []);
    const s = arr.map(textOf);
    console.log('VERT sample count', s.length);
    if (s.length) scan(s, 'BENIGN-VERT');
  } else {
    console.log('VERT no run fn');
  }
} catch (e) { console.log('BENIGN-VERT ERR', e.message); }

// 3) gate-benchmark 的良性类别
try {
  const gb = require('../test/gate-benchmark.js');
  const arr = Array.isArray(gb) ? gb : (gb.SAMPLES || gb.samples || []);
  const s = arr.map(textOf).filter(Boolean);
  console.log('GB count', s.length);
  if (s.length) scan(s, 'GATE-BENCH');
} catch (e) { console.log('GATE-BENCH ERR', e.message); }
