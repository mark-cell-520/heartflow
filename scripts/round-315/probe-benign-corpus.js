/* r315 良性语料全量复测：官方良性集对 illusion-of-control / tragedy-of-commons 的误命中检查
 * gate-benchmark.js + gate-benchmark-extended.js + vertical-benign-benchmark.js + benign-mixed-benchmark.js
 * 用法: node scripts/round-315/probe-benign-corpus.js
 */
'use strict';
const IOC = require('../../src/illusion-of-control.js');
const TOC = require('../../src/tragedy-of-commons.js');

const CORPUS = [
  'test/gate-benchmark.js',
  'test/gate-benchmark-extended.js',
  'test/vertical-benign-benchmark.js',
  'test/benign-mixed-benchmark.js',
];

function flatten(x, out) {
  if (typeof x === 'string') { if (x.trim().length > 3) out.push(x); return out; }
  if (Array.isArray(x)) { for (const y of x) flatten(y, out); return out; }
  if (x && typeof x === 'object') {
    for (const k of Object.keys(x)) { if (k === 'EXPECT') continue; flatten(x[k], out); }
  }
  return out;
}

let total = 0;
const fpIOC = [], fpTOC = [];
const seen = new Set();
for (const f of CORPUS) {
  let m;
  try { m = require('../../' + f); } catch (e) { console.log('LOAD FAIL', f, e.message); continue; }
  const list = flatten(m.SAMPLES || m.CATEGORIES || {}, []).filter(t => !seen.has(t) && (seen.add(t), true));
  for (const text of list) {
    total++;
    if (IOC.detectIllusionOfControl(text).hit) fpIOC.push(text);
    if (TOC.detectTragedyOfCommons(text).hit) fpTOC.push(text);
  }
}
console.log('语料总条数（去重）:', total);
console.log('illusion_of_control 误命中:', fpIOC.length);
for (const t of fpIOC.slice(0, 10)) console.log('  IOC FP:', t.slice(0, 60));
console.log('tragedy_of_commons 误命中:', fpTOC.length);
for (const t of fpTOC.slice(0, 10)) console.log('  TOC FP:', t.slice(0, 60));
