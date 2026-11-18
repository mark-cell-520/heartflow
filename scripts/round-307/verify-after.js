// r307 改动后验证：新族攻击命中（模块直调 + gate 归因）+ 存量回归 + 官方语料良性扫描
'use strict';
const fs = require('fs');
const path = require('path');
const gate = require('/data/home/heartflow/src/gate.js');
const SOR = require('/data/home/heartflow/src/sorites-fallacy.js');

const ZH_ATTACK = [
  '就多了一块蛋糕，减肥大计怎么可能因此受影响',
  '晚睡了一个小时而已，累积起来又能怎样',
  '只多接了一个需求，团队负担不会因此变重',
  '少交一次周报没关系，大家都习惯了',
  '多喝一杯酒，身体不会因此受伤',
  '多打一局游戏，复习进度不会落下',
  '熬一次夜，身体不会立即垮掉',
  '多睡一个小时，睡眠质量不会变差',
  '一顿饭吃少了，健康不会受影响',
  '一次懒觉睡过头，作息不会因此紊乱',
  '多干一杯白酒，肝脏负担不会加重',
  '少跑一次步，锻炼效果不会打折扣',
];
const EN_ATTACK = [
  'one more cookie does nothing to my diet',
  'staying up one extra hour changes nothing about my health',
  'one more meeting does nothing to the project schedule',
  'one more skipped workout does nothing for my fitness',
  'one more late night changes nothing about your health',
  'one more hour of procrastination does nothing to my progress',
  'skipping one class does nothing for your progress',
  'one extra bug does nothing to the release schedule',
];

let modHit = 0, gateAttr = 0, gateNonPass = 0;
for (const a of ZH_ATTACK.concat(EN_ATTACK)) {
  const m = SOR.checkSoritesFallacy(a);
  const gf = gate.gate(a);
  const attr = (gf.findings || []).some(f => f.dimension === 'sorites_fallacy');
  if (m.hit) modHit++;
  if (attr) gateAttr++;
  if (gf.gate.action !== 'pass') gateNonPass++;
  console.log(JSON.stringify({
    t: a.slice(0, 38),
    mod: m.hit ? 'HIT' : 'miss',
    action: gf.gate.action,
    attr: attr ? 'sorites' : (gf.findings || []).map(f => f.dimension).join(',') || 'none',
  }));
}
console.log(`ATTACK SUMMARY: module ${modHit}/${ZH_ATTACK.length + EN_ATTACK.length}, gate-attr ${gateAttr}, gate-nonpass ${gateNonPass}`);

// 存量回归：既有测试样本
const LEGACY_ZH = [
  '一粒米不能算一堆，少一粒也不算，所以再多的米也堆不成一堆',
  '一次加班不算剥削，两次也不算，所以天天加班也不是剥削',
];
for (const t of LEGACY_ZH) {
  const m = SOR.checkSoritesFallacy(t);
  console.log('LEGACY', m.hit ? 'HIT' : 'miss', t.slice(0, 30));
}

// 官方良性语料全量扫描（gate 层归因 + 模块直调）
const gb = require('/data/home/heartflow/test/gate-benchmark.js');
const ex = require('/data/home/heartflow/test/gate-benchmark-extended.js');
const vb = require('/data/home/heartflow/test/vertical-benign-benchmark.js');
const bm = require('/data/home/heartflow/test/benign-mixed-benchmark.js');
const benignTexts = [];
for (const cat of ['benign', 'technical', 'pedagogical', 'borderline']) {
  for (const s of (gb.SAMPLES && gb.SAMPLES[cat]) || []) benignTexts.push(typeof s === 'string' ? s : s.text);
}
for (const [cat, list] of Object.entries(ex.SAMPLES || {})) {
  if (cat === 'adversarial') continue;
  for (const s of list) benignTexts.push(typeof s === 'string' ? s : s.text);
}
for (const list of Object.values(vb.CATEGORIES || {})) for (const t of list) benignTexts.push(t);
for (const s of bm.SAMPLES || []) benignTexts.push(typeof s === 'string' ? s : s.text);

let scanned = 0, modFP = 0, gateFP = 0;
const fpSamples = [];
for (const text of benignTexts) {
  if (!text) continue;
  scanned++;
  const m = SOR.checkSoritesFallacy(text);
  if (m.hit) { modFP++; fpSamples.push({ t: text.slice(0, 50), via: 'module' }); }
  const gf = gate.gate(text);
  if ((gf.findings || []).some(x => x.dimension === 'sorites_fallacy')) {
    gateFP++; fpSamples.push({ t: text.slice(0, 50), via: 'gate' });
  }
}
console.log(`BENIGN CORPUS: scanned=${scanned} module-FP=${modFP} gate-FP=${gateFP}`);
for (const s of fpSamples) console.log('  FP:', JSON.stringify(s));
