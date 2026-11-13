/* r314 调试：为什么 "I'll start tomorrow, tonight I want to enjoy..." 不命中 NOW_EN */
'use strict';
const PB = require('../../src/present-bias.js');
const I = PB.__internals();
const t = "I'll start tomorrow, tonight I want to enjoy what I can actually feel";
console.log('text:', t);
console.log('NOW_EN matches:');
for (const re of I.NOW_EN) {
  const m = re.exec(t);
  console.log('  ', re.source.slice(0, 70), '=>', m ? JSON.stringify(m[0]) : null);
}
console.log('LATER_EN matches:');
for (const re of I.LATER_EN) {
  const m = re.exec(t);
  console.log('  ', re.source.slice(0, 70), '=>', m ? JSON.stringify(m[0]) : null);
}
console.log('CONCEPT_EN:', I.CONCEPT_EN.test(t));
console.log('CORRECTIVE_EN:', I.CORRECTIVE_EN.test(t));
console.log('detect:', JSON.stringify(PB.detectPresentBias(t).hit));
