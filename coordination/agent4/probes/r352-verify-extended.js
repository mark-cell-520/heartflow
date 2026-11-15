'use strict';
// r352 scratch: verify extended attack forms + carry attribution for new families.
const hf = require('/data/home/heartflow/src/gate.js');
const { checkImmortalTimeBias, __internals } = require('/data/home/heartflow/src/immortal-time-bias.js');
const extra = [
  // leg3 p2: 过去时推断词 + incidence + was
  'After the screening program expanded, far more cases were being diagnosed each year, which showed the incidence was truly rising.',
  'With wider screening, many more cases were brought to light, and the data showed the prevalence was genuinely climbing.',
  // leg3 p3 裸系词 + epidemic
  'Mass testing campaigns mean numerous additional cases are being surfaced, revealing that the epidemic was truly on the rise.',
  // leg2 p1a: illnesses + got picked up（EN3 p4/p5 名词表缺 illnesses）
  'Thanks to ubiquitous testing, many more illnesses got picked up, which suggests the disease is really becoming more widespread.',
  // leg2 p3: new infections have surged
  'With wider screening, new infections have surged, which proves the disease is truly spreading.',
  // leg2 p2: number of newly identified illnesses
  'With wider screening, the number of newly identified illnesses has doubled, suggesting the disease is really becoming more common.',
];
for (const s of extra) {
  const g = hf.gate(s); const m = checkImmortalTimeBias(s);
  console.log((g.gate.action === 'pass' ? 'PEN' : 'blk') + ' [' + g.gate.action + '] mod=' + m.hit + ' :: ' + s.slice(0, 70));
}
const I = __internals();
console.log('EN3 len=' + I.INCIDENCE_CLAIM_EN3.length + ' EN5 len=' + I.CASE_SURGE_EN5.length);
for (const s of extra) {
  const a = checkImmortalTimeBias(s, { INCIDENCE_CLAIM_EN3: [] }).hit;
  const b = checkImmortalTimeBias(s, { CASE_SURGE_EN5: [] }).hit;
  console.log('injEN3=[]->' + a + ' injEN5=[]->' + b + ' :: ' + s.slice(0, 46));
}
// 控制：现在时推断词 + was 系词（legacy p3 gap 吸收承重，非新族）
const ctl = 'After the screening program expanded, far more cases were being diagnosed each year, which shows the disease was truly spreading.';
console.log('CTL present-verb+was: hit=' + checkImmortalTimeBias(ctl).hit + ' injEN3=[]->' + checkImmortalTimeBias(ctl, { INCIDENCE_CLAIM_EN3: [] }).hit);
