'use strict';
// r350 quick verification: new leg① family (DETECT_UP_EN4/ZH4) — attacks hit,
// benign clean, existing constants unchanged. Not the round test; scratch probe.
const { checkImmortalTimeBias, __internals } = require('/data/home/heartflow/src/immortal-time-bias.js');
const hf = require('/data/home/heartflow/src/gate.js');
const A = [
  'The widespread adoption of CT scans has identified many more tumors, which shows the cancer is truly becoming more prevalent.',
  'With the growing use of MRI, far more lesions are detected, suggesting the disease is really spreading.',
  'As CT scanning became universal, numerous additional cases were picked up, indicating the illness is genuinely on the rise.',
  'With CT now standard practice, many more tumors are identified, suggesting the cancer is really becoming more common.',
  'Thanks to ubiquitous testing, many more cases have been identified, which suggests the disease is really becoming more widespread.',
  'Widespread testing has surfaced many more cases, indicating the disease is really on the rise.',
  'Mass testing campaigns have detected many more cases, which suggests the disease is truly spreading.',
  'The expansion of testing capacity has surfaced numerous additional cases, suggesting the disease is genuinely becoming more widespread.',
  '排查力度的加强让更多病例被发现，可见疾病真的在蔓延。',
  '监测力度的加大让更多病例浮出水面，说明患病率真的在上升。',
  '全面排查让大量既往漏掉的病例被重新发现，足以证明这种病真的在变多。',
];
for (const s of A) {
  const m = checkImmortalTimeBias(s);
  const g = hf.gate(s);
  const itb = (g.findings || []).some(f => f.dimension === 'immortal_time_bias');
  console.log((m.hit ? 'HIT' : 'miss') + ' gate=' + g.gate.action + ' itb=' + itb + ' :: ' + s.slice(0, 42));
}
console.log('--- benign ---');
const B = [
  'The widespread adoption of CT scans has identified many more tumors, but the true incidence may be unchanged.',
  'With the growing use of MRI, far more lesions are being detected, yet the underlying rate appears stable.',
  'Thanks to ubiquitous testing, many more cases have been identified, though the real incidence seems stable once ascertainment is accounted for.',
  'Mass testing campaigns have detected many more cases, but the actual prevalence does not appear to be rising.',
  '排查力度的加强让更多病例被发现，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '监测力度的加大让更多病例浮出水面，然而真实患病率似乎并没有变化。',
  '全面排查让大量既往漏掉的病例被重新发现，但这反映的是检出提前，不代表发病率真的上升。',
  'The hospital expanded CT scanning capacity last year to reduce emergency wait times.',
  '随着排查力度加大，社区漏诊率明显下降，公共卫生部门认为这是早期发现策略的成功。',
];
for (const s of B) {
  const m = checkImmortalTimeBias(s);
  console.log((m.hit ? 'FP!' : 'ok ') + ' :: ' + s.slice(0, 42));
}
console.log('--- internals ---');
const I = __internals();
console.log('DETECT_UP_EN4=' + I.DETECT_UP_EN4.length + ' DETECT_UP_ZH4=' + I.DETECT_UP_ZH4.length);
console.log('DETECT_UP_EN=' + I.DETECT_UP_EN.length + ' DETECT_UP_ZH=' + I.DETECT_UP_ZH.length + ' LEAD_SCREEN_EN=' + I.LEAD_SCREEN_EN.length + ' LEAD_SCREEN_ZH=' + I.LEAD_SCREEN_ZH.length);
