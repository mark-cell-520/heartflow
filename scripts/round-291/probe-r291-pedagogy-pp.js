/**
 * 第 291 轮探针：复测 r290 唯一失败断言
 *   「幸福不是拥有得多，而是计较得少」—— 维度函数命中 count=1 但 gate findings 为空
 * 逐层打印：checkPseudoProfundity 原始结果 → pedagogy relax 前后 → findings 门槛判定
 */
'use strict';
const path = require('path');
const idx = require('../../src/index.js');
const ped = require('../../src/pedagogy.js');

const SAMPLE = '幸福不是拥有得多，而是计较得少。';

function show(tag, r) {
  if (!r) { console.log(`  ${tag}: null`); return; }
  console.log(`  ${tag}: score=${r.score} count=${r.count} sev=${r.severity} hits=${JSON.stringify((r.hits || []).slice(0, 3))}`);
}

console.log('== 1. detectPedagogicalContent ==');
const p = ped.detectPedagogicalContent(SAMPLE);
console.log('  pedagogy =', JSON.stringify(p));
console.log('  relax    =', JSON.stringify(ped.getPedagogyRelaxation(p)));

console.log('== 2. 维度函数直调 ==');
let raw = null;
try { raw = idx.discriminate(SAMPLE); } catch (e) { console.log('  discriminate err', e.message); }
if (raw) {
  console.log('  gate.action =', raw.gate && raw.gate.action);
  console.log('  verdict     =', raw.verdict);
  console.log('  findings    =', JSON.stringify(raw.findings));
  console.log('  checked_by  =', JSON.stringify((raw.checked_by || []).map(c => c.layer + ':' + (c.action || c.score))));
  const dims = raw.dimensions || raw.dimensionScores || null;
  if (dims) {
    const pp = typeof dims === 'object' ? (Array.isArray(dims) ? dims.find(d => d.dimension === 'pseudo_profundity') : dims.pseudo_profundity) : null;
    show('  dim pseudo_profundity', pp);
  }
}

console.log('== 3. gate 直调 ==');
try {
  const g = idx.gate(SAMPLE);
  console.log('  action  =', g.gate && g.gate.action);
  console.log('  reason  =', g.gate && g.gate.reason);
  console.log('  findings=', JSON.stringify((g.findings || []).map(f => ({ d: f.dimension, s: f.severity, sc: f.score }))));
} catch (e) { console.log('  gate err', e.message); }
