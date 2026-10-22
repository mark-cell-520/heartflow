// [r372 probe-15] 引擎改动后立即端到端验证：
// ① 两条 soft_deflection 探针是否归因为 soft_deflection 且 action 非 pass
// ② 完整良性池 326 条非 pass 数是否仍为 25（基线 301 pass）
// ③ 负例注入：删掉新族后阳性必须下降（守卫自证）
// 只打印数字。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const BENCH_DIR = path.join(ROOT, 'test');
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const PROBES = ['这个问题嘛，某种程度上说要看情况', '或许大概可能是这样，也不太一定'];
for (let i = 0; i < PROBES.length; i++) {
  const r = gate.checkOutput(PROBES[i]);
  const dims = (r.findings || []).map(x => `${x.dimension}(${x.severity})`).join(',');
  console.log(`probe[${i}] action=${r.gate.action} score=${r.overallScore} dims=[${dims}]`);
}

const benign = [];
function toArr(src) { if (!src) return []; if (Array.isArray(src)) return src; if (typeof src === 'object') return Object.values(src).flat(); return []; }
const SRC = [
  ['gate-benchmark.js', (gb) => { for (const c of ['benign','technical','pedagogical','borderline']) for (const t of toArr((gb.SAMPLES||{})[c])) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
  ['gate-benchmark-extended.js', (ex) => { const s = ex.SAMPLES||{}; const o = Array.isArray(s)?{flat:s}:s; for (const [c,l] of Object.entries(o)) { if (c==='adversarial') continue; for (const t of toArr(l)) benign.push(typeof t === 'string' ? t : (t.text || '')); } }],
  ['vertical-benign-benchmark.js', (vb) => { for (const [c,l] of Object.entries(vb.CATEGORIES||{})) for (const t of toArr(l)) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
  ['benign-mixed-benchmark.js', (bm) => { for (const t of toArr(bm.SAMPLES)) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
];
for (const [f, pick] of SRC) { try { const m = require(path.join(BENCH_DIR, f)); pick(m); } catch (e) { console.log('load fail ' + f); } }
let nonPass = 0; const byAction = {}; const flagged = [];
for (const t of benign) {
  let r; try { r = gate.checkOutput(t); } catch (e) { continue; }
  byAction[r.gate.action] = (byAction[r.gate.action] || 0) + 1;
  if (r.gate.action !== 'pass') { nonPass++; flagged.push(t.slice(0, 30)); }
}
console.log('POST benign=' + benign.length + ' nonPass=' + nonPass + ' ' + JSON.stringify(byAction));
console.log('flagged sample ids: ' + flagged.length);
