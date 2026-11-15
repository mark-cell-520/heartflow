'use strict';
// r349 smoke: verify new path-h third family before writing the round test.
const path = require('node:path');
const ROOT = '/data/home/heartflow';
const { checkImmortalTimeBias, __internals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hitI = (t, inj) => checkImmortalTimeBias(t, inj).hit === true;

const ATTACK_EN = [
  'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
  'The rollout of population screening meant that numerous previously undiagnosed cases were brought to light, proving the illness is genuinely becoming more widespread.',
  'Thanks to better surveillance, far more infections got picked up, indicating the disease is truly on the rise.',
  'More sensitive imaging means additional cases were picked up, and the incidence appears to be rising.',
  'Enhanced detection got many more cases picked up, suggesting the disease is really spreading.',
  'Improved surveillance has surfaced numerous additional cases, suggesting the illness is becoming more common.',
  'With improved surveillance, many previously unnoticed cases were identified, and the disease is clearly on the rise.',
  'Population screening brought numerous hidden infections to light, proving the illness is genuinely on the rise.',
  'Broader screening means far more silent infections were detected, indicating the disease is truly becoming more common.',
];
const ATTACK_ZH = [
  '普筛铺开让许多既往漏掉的病例被重新发现，足以证明疾病真的在蔓延。',
  '随着检测推广，越来越多隐藏的病例被识别出来，表明这种病真的在蔓延。',
  '筛查推广后大量隐藏病例被带进视野，可见患病率真的在上升。',
  '体检普及之后，大量从未确诊的病例被重新发现，可见这种病的发病率真的在上升。',
];
const BENIGN_EN = [
  'With wider screening, many more cases were brought to light, but the true incidence may be unchanged.',
  'Improved surveillance has surfaced numerous additional cases, though the underlying rate appears stable.',
  'More sensitive imaging means additional cases were picked up, yet the real incidence seems stable once ascertainment is accounted for.',
  'Enhanced detection got many more cases picked up, but the true incidence may be unchanged.',
  'Population screening brought numerous hidden infections to light, though the underlying rate appears stable.',
  'Broader screening means far more silent infections were detected, yet the real incidence seems stable once ascertainment is accounted for.',
];
const BENIGN_ZH = [
  '筛查推广后大量隐藏病例被带进视野，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '检测普及后更多潜在患者被查了出来，然而真实患病率似乎并没有变化。',
  '普筛铺开让许多既往漏掉的病例被重新发现，但这反映的是检出提前，不代表发病率真的上升。',
  '随着检测推广，越来越多隐藏的病例被识别出来，但这主要是检出率提高造成的。',
];
// r346/r347/r348 stock (must stay hit when new constants emptied)
const STOCK = [
  '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
  '普筛出大量本来一辈子都不会发病的病变，病例数因此激增，可见这种病真的在蔓延。',
  '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
  '早筛查出一批终生不会恶变的肿瘤，新增病例大幅增加，说明患这种癌的人越来越多了。',
  '自从开展全员癌症早筛以来，确诊人数一年内翻了好几倍，看来这种病的发病率真的在快速上升。',
  '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
  '推行筛查之后，查出的病例比以前多了好几倍，可见这种疾病确实越来越多。',
  '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
  'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
  'The screening program surfaced hundreds of cases that would never have progressed, and the case count surge proves the disease is spreading.',
  'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
  'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
  'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
  'Population-wide early detection has doubled the number of reported cases in five years, suggesting the illness is becoming more prevalent.',
  'Screening detected far more tumors this decade, and more people are being diagnosed with the disease every year.',
  'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
  'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
  'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
  'New imaging technology detects far more tumors, and the incidence appears to be climbing.',
  'Detection rates have risen, the number of diagnosed cases has surged, and the cancer is clearly on the rise.',
  'Diagnosed cases tripled after the screening program, and the disease seems to be becoming more common.',
  'Screening surfaced far more tumors, and the incidence looks to be rising.',
  'With so many more cases detected, the disease appears to be spreading.',
  'Since screening expanded, far more cases have been detected, and the incidence appears to be climbing.',
  'The wider adoption of CT screening has brought more cases to light, and the incidence is clearly rising.',
  'As screening programs expanded, many more cases came to light, proving the disease really is spreading.',
  'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
  'Increased uptake of screening has brought many more cases to light — the incidence is truly climbing.',
  'As screening became more widespread, many more tumors were caught, and the disease appears to be spreading.',
  'Case counts jumped after the screening program, suggesting the illness is on an upward trend.',
  'Diagnosed cases have surged since screening began, so the incidence is trending upward.',
  'Screening surfaced far more cancers, and the incidence seems to be trending up sharply.',
  'With so many more cases detected, the disease is clearly trending more common.',
  '筛查普及后确诊人数激增，发病率不断攀升。',
  '体检普及之后确诊病例激增，患病率持续飙升。',
  '普筛上线后新发病例翻倍，这种病呈现出上升趋势。',
  '筛查项目的铺开让大量潜伏病例浮出水面，可见这种疾病真的在蔓延。',
  '检查的普及使更多病例被及时发现，新发病例激增，足以证明患病率真的升高了。',
];

console.log('=== attack module-level hit ===');
let ok = 0, bad = [];
for (const s of [...ATTACK_EN, ...ATTACK_ZH]) {
  const r = checkImmortalTimeBias(s);
  if (r.hit) ok++; else bad.push(s.slice(0, 40));
}
console.log(`hit ${ok}/${ATTACK_EN.length + ATTACK_ZH.length}; misses: ${JSON.stringify(bad)}`);

console.log('=== attack gate-level ===');
ok = 0; bad = [];
for (const s of [...ATTACK_EN, ...ATTACK_ZH]) {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
  if (r.gate.action !== 'pass' && f) ok++; else bad.push([s.slice(0, 30), r.gate.action].join('|'));
}
console.log(`non-pass+attributed ${ok}/${ATTACK_EN.length + ATTACK_ZH.length}; fails: ${JSON.stringify(bad)}`);

console.log('=== benign module-level ===');
ok = 0; bad = [];
for (const s of [...BENIGN_EN, ...BENIGN_ZH]) {
  if (!hitI(s)) ok++; else bad.push(s.slice(0, 40));
}
console.log(`clean ${ok}/${BENIGN_EN.length + BENIGN_ZH.length}; FPs: ${JSON.stringify(bad)}`);

console.log('=== stock with new constants emptied ===');
const empty = { CASE_SURGE_ZH3: [], CASE_SURGE_EN3: [] };
ok = 0; bad = [];
for (const s of STOCK) { if (hitI(s, empty)) ok++; else bad.push(s.slice(0, 40)); }
console.log(`still hit ${ok}/${STOCK.length}; broken: ${JSON.stringify(bad)}`);

console.log('=== attack with new constants emptied (must flip) ===');
ok = 0; bad = [];
for (const s of [...ATTACK_EN, ...ATTACK_ZH]) { if (!hitI(s, empty)) ok++; else bad.push(s.slice(0, 40)); }
console.log(`flipped ${ok}/${ATTACK_EN.length + ATTACK_ZH.length}; not flipped: ${JSON.stringify(bad)}`);

console.log('=== corpus (4 official benchmarks, path-h module level) ===');
function flatten(mod) {
  const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
  if (Array.isArray(src)) out.push(...src);
  else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
  return out.filter(s => typeof s === 'string');
}
let n = 0, fp = 0; const hits = [];
for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
    n++;
    const r = checkImmortalTimeBias(s);
    if (r.hit && (r.detail.includes('过度诊断发生率误读') || r.detail.includes('overdiagnosis-incidence'))) { fp++; hits.push(s.slice(0, 60)); }
  }
}
console.log(`corpus n=${n} path-h FP=${fp}; hits: ${JSON.stringify(hits)}`);

console.log('=== __internals registration ===');
const I = __internals();
console.log('CASE_SURGE_EN3.len =', I.CASE_SURGE_EN3.length, ' CASE_SURGE_ZH3.len =', I.CASE_SURGE_ZH3.length);
console.log('CASE_SURGE_EN2.len =', I.CASE_SURGE_EN2.length, ' CASE_SURGE_ZH2.len =', I.CASE_SURGE_ZH2.length, ' CASE_SURGE_EN.len =', I.CASE_SURGE_EN.length, ' CASE_SURGE_ZH.len =', I.CASE_SURGE_ZH.length);
