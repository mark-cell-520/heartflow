'use strict';
// r355 after-landing verification: gate-layer + module-level attack/benign checks.
const hf = require('/data/home/heartflow/src/gate.js');
const I = require('/data/home/heartflow/src/immortal-time-bias.js');

const ATTACK = [
  // A leg② pick + more + adjective + noun (CASE_SURGE_EN9a)
  'With sensitive testing, the scan picked up far more early-stage tumors, suggesting the cancer is truly becoming more common.',
  'Thanks to improved testing, the assay picked up many more small lesions, indicating the disease is genuinely spreading.',
  'After testing coverage expanded, the program picked up significantly more indolent cancers, which shows the illness is really becoming more widespread.',
  'With wider screening, the clinic picked up far more early-stage cases, suggesting the disease is truly on the rise.',
  // B leg② quantifier + noun + bare past (CASE_SURGE_EN9b)
  'With sensitive testing, numerous additional cases surfaced, proving the disease is becoming more common.',
  'Thanks to improved surveillance, many previously hidden infections surfaced, suggesting the illness is really spreading.',
  'After testing coverage expanded, numerous silent cases surfaced, which indicates the cancer is truly becoming more widespread.',
  'With widespread testing, far more cases surfaced, showing the disease is genuinely on the rise.',
  // C ZH leg① adjective-front (DETECT_UP_ZH5)
  '随着更灵敏的影像检查应用，大量病例被重新发现，表明这种病真的在变多。',
  '新型的检验技术上线后，大量无症状感染者被确诊，表明患病率确实在提高。',
  '更先进的诊断方法应用后，众多潜伏病例被识别出来，说明发病率确实在升高。',
  '随着更精确的检验手段应用，大批隐匿病灶被查出，表明这种病真的在蔓延。',
  // D ZH leg② 浮出 verb-front (CASE_SURGE_ZH4)
  '随着检测普及，浮出大量潜伏病例，这说明这种病真的在变多。',
  '筛查推广后，浮现出许多无症状感染者，表明患病率确实在升高。',
  '体检普及以来，暴露出越来越多隐匿病灶，说明癌症真的高发了。',
  '普筛开展后，显露出大量以往漏诊的病例，表明发病率真的在上升。',
  // E ZH dual-gap combos
  '更先进的检测手段浮出大量潜伏病例，这说明这种病真的在变多。',
  '随着更精准的检查技术应用，浮出众多以往漏诊的病例，表明发病率确实在上升。',
  '新型检验技术上线后，暴露出大量无症状感染者，说明患病率真的在提高。',
];

const BENIGN = [
  'With sensitive testing, the scan picked up far more early-stage tumors, though the true incidence appears stable.',
  'The new protocol picked up far more early-stage tumors in the pilot, and the radiology team logged them for review.',
  'Better imaging picked up many more small nodules, most of which were benign on follow-up.',
  'With sensitive testing, numerous additional cases surfaced, but the actual prevalence does not appear to be rising.',
  'Numerous additional historical cases surfaced during the audit, and the data team flagged them for follow-up.',
  'Many previously hidden infections surfaced in the registry review, prompting a quality improvement project.',
  '更先进的检测手段让更多早期肿瘤被检出，但这并不代表发病率真的上升。',
  '更先进的检测手段有助于早发现早治疗，是体检中心的常规推荐。',
  '随着检测普及，浮出大量潜伏病例，但这并不代表发病率真的上升。',
  '筛查推广后浮现出的无症状感染者，均已纳入随访名单。',
  '普筛后暴露出不少问题环节，质检部门正在整改。',
  '更先进的检测手段浮出大量潜伏病例，但真实发病率可能并没有上升。',
];

let bad = 0;
for (const t of ATTACK) {
  const r = hf.gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const ok = r.gate.action !== 'pass' && dims.includes('immortal_time_bias');
  if (!ok) { bad++; console.log('MISS [' + r.gate.action + '] ' + dims.join(',') + ' :: ' + t.slice(0, 30)); }
}
console.log('attack gate-layer 非pass 且 immortal_time_bias 承重: ' + (ATTACK.length - bad) + '/' + ATTACK.length);

let mbad = 0;
for (const t of ATTACK) { if (!I.checkImmortalTimeBias(t).hit) { mbad++; console.log('MOD-MISS ' + t.slice(0, 30)); } }
console.log('attack 模块级命中: ' + (ATTACK.length - mbad) + '/' + ATTACK.length);

let bbad = 0;
for (const t of BENIGN) { if (I.checkImmortalTimeBias(t).hit) { bbad++; console.log('BEN-MOD-HIT ' + t.slice(0, 30)); } }
console.log('benign 模块级路径 h 不判: ' + (BENIGN.length - bbad) + '/' + BENIGN.length);
