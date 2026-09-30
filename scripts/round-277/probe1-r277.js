// 第 277 轮缺口复测：良性侧 25 条非 pass 的维度归因 + `all \w+ are` 旧判据误伤定位。
// 纪律：样本只以「形状」出现；只输出数字与归因维度名，不打印样本文本。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(text) {
  const r = gate.checkOutput(text);
  return r && r.gate ? r.gate.action : 'none';
}

// 复刻 bidirectional-guard 的良性集装载
const sets = {};
const toArray = (src) => {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (typeof src === 'object') return Object.values(src).flat();
  return [];
};
const textOf = (s) => (typeof s === 'string' ? (s && s.text) || '' : '');

try {
  const gb = require(path.join(__dirname, '..', '..', 'test', 'gate-benchmark.js'));
  for (const cat of ['benign', 'technical', 'borderline', 'pedagogical']) {
    sets['gate-97.' + cat] = toArray(gb.SAMPLES[cat]);
  }
} catch (e) { console.log('LOAD gate-97 FAIL: ' + e.message); }
try {
  const ex = require(path.join(__dirname, '..', '..', 'test', 'gate-benchmark-extended.js'));
  for (const cat of ['multilingual', 'longtext', 'mixed']) {
    sets['ext.' + cat] = toArray(ex.SAMPLES[cat]);
  }
} catch (e) { console.log('LOAD ext FAIL: ' + e.message); }
try {
  const vb = require(path.join(__dirname, '..', '..', 'test', 'vertical-benign-benchmark.js'));
  const all = [];
  for (const list of Object.values(vb.CATEGORIES || {})) all.push(...list);
  sets['vert'] = all;
} catch (e) { console.log('LOAD vert FAIL: ' + e.message); }
try {
  const bm = require(path.join(__dirname, '..', '..', 'test', 'benign-mixed-benchmark.js'));
  sets['mixed'] = toArray(bm.SAMPLES);
} catch (e) { console.log('LOAD mixed FAIL: ' + e.message); }

let total = 0, nonPass = 0;
const dimCount = {};
const shapeCount = {};
for (const [key, list] of Object.entries(sets)) {
  for (const s of list) {
    const text = typeof s === 'string' ? s : (s && s.text) || '';
    if (!text) continue;
    total++;
    const r = gate.checkOutput(text);
    const a = r && r.gate ? r.gate.action : 'none';
    if (a === 'pass' || a === 'none') continue;
    nonPass++;
    for (const f of (r.findings || [])) {
      dimCount[f.dimension] = (dimCount[f.dimension] || 0) + 1;
    }
    // 形状归类（只看判据形状，不看原文）
    const t = text.toLowerCase();
    let shape = 'other';
    if (/^all\s+\w+\s+(are|is)\b/.test(t)) shape = 'all_<obj>_are 全称句式';
    else if (/\ball\s+\w+\s+(are|is)\b/.test(t)) shape = '内嵌 all_<obj>_are';
    else if (/\b(every|each)\s+\w+/.test(t)) shape = 'every/each 句式';
    else if (/\b(always|never|everyone|nobody)\b/.test(t)) shape = '极端量化词';
    else shape = '其他';
    shapeCount[shape] = (shapeCount[shape] || 0) + 1;
  }
}
console.log('BENIGN_TOTAL = ' + total);
console.log('BENIGN_NONPASS = ' + nonPass);
console.log('NONPASS_BY_DIM = ' + JSON.stringify(dimCount));
console.log('NONPASS_BY_SHAPE = ' + JSON.stringify(shapeCount));

// 逐个定位 hasty_generalization 的 all_<obj>_are 贡献
const targets = [];
for (const [key, list] of Object.entries(sets)) {
  for (const s of list) {
    const text = typeof s === 'string' ? s : (s && s.text) || '';
    if (!text) continue;
    const a = act(text);
    if (a === 'pass' || a === 'none') continue;
    const r = gate.checkOutput(text);
    const dims = (r.findings || []).map(f => f.dimension);
    if (dims.includes('hasty_generalization')) {
      targets.push({ key, text, action: a, dims, hasAllAre: /\ball\s+\w+\s+(are|is)\b/i.test(text) });
    }
  }
}
console.log('HASTY_BENIGN_FP_COUNT = ' + targets.length);
console.log('HASTY_OF_WHICH_ALL_ARE = ' + targets.filter(t => t.hasAllAre).length);
console.log('HASTY_FP_DETAILS = ' + JSON.stringify(
  targets.map(t => ({ set: t.key, action: t.action, allAre: t.hasAllAre, otherDims: t.dims.filter(d => d !== 'hasty_generalization') })),
  null, 0));
