/* r314 良性语料全量复测：官方良性集对 present-bias / endowment-effect 的误命中检查
 * gate-97 (gate-benchmark.js) + extended (gate-benchmark-extended.js SAMPLES)
 * + vertical (vertical-benign-benchmark.js) + mixed (benign-mixed-benchmark.js)
 * 用法: node scripts/round-314/probe-benign-corpus.js
 */
'use strict';
const PB = require('../../src/present-bias.js');
const EE = require('../../src/endowment-effect.js');

function loadMods(files) {
  const out = [];
  for (const f of files) {
    try {
      const m = require('../../' + f);
      const cands = [];
      for (const k of Object.keys(m)) {
        const v = m[k];
        if (Array.isArray(v) && v.length > 5 && v.every(x => typeof x === 'string' || (x && typeof x === 'object'))) cands.push({ k, v });
      }
      out.push({ f, cands });
    } catch (e) { console.log('load fail', f, e.message); }
  }
  return out;
}

// 四个语料文件的样本数组键名按 r311 轮实测记录
const CORPUS = [
  { file: 'test/gate-benchmark.js', keys: ['SAMPLES'] },
  { file: 'test/gate-benchmark-extended.js', keys: ['SAMPLES'] },
  { file: 'test/vertical-benign-benchmark.js', keys: ['SAMPLES'] },
  { file: 'test/benign-mixed-benchmark.js', keys: ['SAMPLES'] },
];

// 四个语料文件的样本结构：SAMPLES 可能是数组或「类别→数组」对象，
// CATEGORIES 同构；统一拍平后逐条过模块。
function flatten(x, out) {
  if (typeof x === 'string') { if (x.trim().length > 3) out.push(x); return out; }
  if (Array.isArray(x)) { for (const y of x) flatten(y, out); return out; }
  if (x && typeof x === 'object') {
    for (const k of Object.keys(x)) {
      if (k === 'EXPECT') continue;
      flatten(x[k], out);
    }
  }
  return out;
}

let total = 0;
const fp = { present: [], endow: [] };
const seen = new Set();
for (const c of CORPUS) {
  let m;
  try { m = require('../../' + c.file); } catch (e) { console.log('LOAD FAIL', c.file, e.message); continue; }
  const list = flatten(m.SAMPLES || m.CATEGORIES || {}, []);
  const uniq = list.filter(t => !seen.has(t) && (seen.add(t), true));
  for (const text of uniq) {
    total++;
    if (PB.detectPresentBias(text).hit) fp.present.push(text);
    if (EE.detectEndowmentEffect(text).hit) fp.endow.push(text);
  }
  console.log(`${c.file}: ${uniq.length} 条（去重后）`);
}
console.log(`\n总计 ${total} 条；present-bias 误命中 ${fp.present.length}，endowment-effect 误命中 ${fp.endow.length}`);
for (const t of fp.present.slice(0, 10)) console.log('  PB FP:', t.slice(0, 80));
for (const t of fp.endow.slice(0, 10)) console.log('  EE FP:', t.slice(0, 80));
