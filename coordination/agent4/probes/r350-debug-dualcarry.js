'use strict';
// r350 scratch: why do some EN attacks survive DETECT_UP_EN4=[] ?
const { checkImmortalTimeBias, __internals } = require('/data/home/heartflow/src/immortal-time-bias.js');
const I = __internals();
const s = 'With the growing use of MRI, far more lesions are detected, suggesting the disease is really spreading.';
console.log('--- DETECT_UP_EN regexes vs failing sentence ---');
I.DETECT_UP_EN.forEach((re, i) => {
  const m = s.match(new RegExp(re.source, re.flags.includes('i') ? 'gi' : 'g'));
  console.log(`p${i + 1}: ${m ? 'MATCH "' + m[0] + '" @' + s.indexOf(m[0]) : 'no'} :: ${re.source.slice(0, 80)}`);
});
console.log('--- LEAD_SCREEN_EN ---');
I.LEAD_SCREEN_EN.forEach((re, i) => {
  const m = s.match(new RegExp(re.source, re.flags.includes('i') ? 'gi' : 'g'));
  console.log(`p${i + 1}: ${m ? 'MATCH "' + m[0] + '"' : 'no'} :: ${re.source.slice(0, 80)}`);
});
console.log('--- leg2 CASE_SURGE_EN ---');
I.CASE_SURGE_EN.forEach((re, i) => {
  const m = s.match(new RegExp(re.source, re.flags.includes('i') ? 'gi' : 'g'));
  console.log(`p${i + 1}: ${m ? 'MATCH "' + m[0] + '"' : 'no'} :: ${re.source.slice(0, 70)}`);
});
console.log('--- leg3 INCIDENCE_CLAIM_EN ---');
I.INCIDENCE_CLAIM_EN.forEach((re, i) => {
  const m = s.match(new RegExp(re.source, re.flags.includes('i') ? 'gi' : 'g'));
  console.log(`p${i + 1}: ${m ? 'MATCH "' + m[0] + '"' : 'no'} :: ${re.source.slice(0, 70)}`);
});
console.log('--- all EN attacks with EN4 emptied ---');
const A = [
  'The widespread adoption of CT scans has identified many more tumors, which shows the cancer is truly becoming more prevalent.',
  'With the growing use of MRI, far more lesions are detected, suggesting the disease is really spreading.',
  'As CT scanning became universal, numerous additional cases were picked up, indicating the illness is genuinely on the rise.',
  'With CT now standard practice, many more tumors are identified, suggesting the cancer is really becoming more common.',
  'Thanks to ubiquitous testing, many more cases have been identified, which suggests the disease is really becoming more widespread.',
  'Widespread testing has surfaced many more cases, indicating the disease is really on the rise.',
  'Mass testing campaigns have detected many more cases, which suggests the disease is truly spreading.',
  'The expansion of testing capacity has surfaced numerous additional cases, suggesting the disease is genuinely becoming more widespread.',
];
for (const t of A) console.log((checkImmortalTimeBias(t, { DETECT_UP_EN4: [] }).hit ? 'STILL-HIT' : 'flipped ') + ' :: ' + t.slice(0, 60));
