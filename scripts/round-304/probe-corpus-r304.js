// probe-corpus-r304.js — 官方良性语料专项（新族腿①词面命中审计）。
// 官方良性语料零词面命中 → 新族不可能制造维度级误伤。
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '../..');
const { checkWeakEvidenceStrongClaim, __internals } = require(path.join(ROOT, 'src/weak-evidence-strong-claim.js'));
const C = __internals();
const AI_ZH = C.EVIDENCE_AI_ZH, AI_EN = C.EVIDENCE_AI_EN;

const corpora = [
  ['gate-benchmark', 'test/gate-benchmark.js'],
  ['gate-benchmark-extended', 'test/gate-benchmark-extended.js'],
  ['benign-mixed', 'test/benign-mixed-benchmark.js'],
  ['vertical-benign', 'test/vertical-benign-benchmark.js'],
];
console.log('=== 官方良性语料专项 ===');
let grand = 0;
for (const [name, rel] of corpora) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.log(name + ': 文件不存在 ' + rel); continue; }
  let mod;
  try { mod = require(p); } catch (e) { console.log(name + ': load-fail ' + String(e).slice(0, 60)); continue; }
  // 提取全部文本样本（兼容数组/对象/分类结构）
  const texts = [];
  const walk = (v) => {
    if (typeof v === 'string') { if (v.length > 4) texts.push(v); return; }
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) {
        if (k === 'text' || k === 'input' || k === 'content' || k === 'sample' || k === 'prompt') {
          if (typeof v[k] === 'string' && v[k].length > 4) texts.push(v[k]);
        } else walk(v[k]);
      }
    }
  };
  walk(mod);
  let leg1 = 0, dim = 0;
  const seen = new Set();
  for (const txt of texts) {
    if (seen.has(txt)) continue;
    seen.add(txt);
    grand++;
    const isZh = /[\u4e00-\u9fff]/.test(txt);
    const list = isZh ? AI_ZH : AI_EN;
    let hit = false;
    for (const re of list) { re.lastIndex = 0; if (re.test(txt)) { hit = true; break; } }
    if (hit) { leg1++; console.log('  LEG1 ' + JSON.stringify(txt.slice(0, 60))); }
    if (checkWeakEvidenceStrongClaim(txt).hit) { dim++; console.log('  DIM ' + JSON.stringify(txt.slice(0, 60))); }
  }
  console.log(`${name}: ${seen.size} 条，新族腿①词面命中 ${leg1}，维度命中 ${dim}`);
}
console.log(`合计 ${grand} 条`);
