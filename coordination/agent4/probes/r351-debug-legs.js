'use strict';
// r351 debug: leg-by-leg diagnosis for the 3 remaining penetrations.
const hf = require('/data/home/heartflow/src/gate.js');
const I = require('/data/home/heartflow/src/immortal-time-bias.js').__internals();
function leg1(s) {
  const cands = {
    LEAD_SCREEN_EN: I.LEAD_SCREEN_EN, DETECT_UP_EN: I.DETECT_UP_EN,
    DETECT_UP_ZH: I.DETECT_UP_ZH, DETECT_UP_EN4: I.DETECT_UP_EN4, DETECT_UP_ZH4: I.DETECT_UP_ZH4,
  };
  const hits = [];
  for (const k in cands) for (const re of cands[k]) { const m = re.exec(s); if (m) hits.push(k + ':"' + m[0] + '"'); }
  return hits;
}
function leg2(s) {
  const cands = {
    CASE_SURGE_EN: I.CASE_SURGE_EN, CASE_SURGE_EN2: I.CASE_SURGE_EN2,
    CASE_SURGE_EN3: I.CASE_SURGE_EN3, CASE_SURGE_EN4: I.CASE_SURGE_EN4,
  };
  const hits = [];
  for (const k in cands) for (const re of cands[k]) { const m = re.exec(s); if (m) hits.push(k + ':"' + m[0] + '"'); }
  return hits;
}
function leg3(s) {
  const cands = { INCIDENCE_CLAIM_EN: I.INCIDENCE_CLAIM_EN, INCIDENCE_CLAIM_EN2: I.INCIDENCE_CLAIM_EN2 };
  const hits = [];
  for (const k in cands) for (const re of cands[k]) { const m = re.exec(s); if (m) hits.push(k + ':"' + m[0] + '"'); }
  return hits;
}
const sentences = [
  'As CT scanning became universal, numerous additional cases are being identified, indicating the illness is genuinely on the rise.',
  'After the screening program expanded, far more cases were being diagnosed each year, which showed the disease was truly spreading.',
  'Thanks to sensitive testing, a growing number of cases is being detected, which suggests the disease is really on the rise.',
  // 候选修复对照句
  'As CT scanning became universal, far more numerous additional cases are being identified, indicating the illness is genuinely on the rise.',
  'After the screening program expanded, far more cases were being diagnosed each year, which shows the disease is truly spreading.',
  'Thanks to ubiquitous testing, a growing number of cases is being detected, which suggests the disease is really on the rise.',
];
for (const s of sentences) {
  const r = hf.gate(s);
  console.log('[' + r.gate.action + '] ' + s.slice(0, 60));
  console.log('  leg1: ' + JSON.stringify(leg1(s)));
  console.log('  leg2: ' + JSON.stringify(leg2(s)));
  console.log('  leg3: ' + JSON.stringify(leg3(s)));
}
