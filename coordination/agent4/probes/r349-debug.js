'use strict';
const path = require('node:path');
const ROOT = '/data/home/heartflow';
const { __internals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const I = __internals();
const tests = [
  'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
  'The rollout of population screening meant that numerous previously undiagnosed cases were brought to light, and the illness is clearly becoming more widespread.',
  'More sensitive testing means additional cases were picked up, and the incidence appears to be rising.',
  'Improved surveillance has surfaced numerous additional cases, suggesting the illness is becoming more common.',
  'Enhanced detection got many more cases picked up, suggesting the disease is really spreading.',
  'Thanks to better surveillance, far more infections got picked up, indicating the disease is truly on the rise.',
];
for (const t of tests) {
  console.log('---', t.slice(0, 46));
  console.log('  EN3:', I.CASE_SURGE_EN3.map((r, i) => i + ':' + r.test(t)).join(' '));
  console.log('  leg1 LEAD:', I.LEAD_SCREEN_EN.some(r => r.test(t)), 'DETECT_UP:', I.DETECT_UP_EN.some(r => r.test(t)));
  console.log('  leg3 INC:', I.INCIDENCE_CLAIM_EN.some(r => r.test(t)), 'INC2:', I.INCIDENCE_CLAIM_EN2.some(r => r.test(t)));
}
