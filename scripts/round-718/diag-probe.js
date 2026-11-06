'use strict';
/* r718 probe：验证测试断言前先跑一遍真实行为 */
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

const PROBES = [
  'Not everyone knows that the meeting was moved.',
  'Everyone knows that the meeting was moved.',
  'No one can prevent this outcome.',
  'Nobody disputes the results.',
  'Everyone must obey the rules without question.',
  'Everyone knows that vitamin C cures colds.',
  'Not everyone must obey the rules without question.',
  'Not everyone knows that vitamin C cures colds.',
];
for (const s of PROBES) {
  const r = gate.checkOutput(s);
  const dims = (r.findings || []).map(f => f.dimension + ':' + f.severity).join(', ') || 'none';
  console.log(s.slice(0, 46).padEnd(48), '=>', r.gate.action.padEnd(7), dims);
}
console.log('---- module counts ----');
const FNS = ['checkHastyGeneralization', 'checkAbsoluteClaim', 'checkTheoryOfMind', 'checkSocialNorm', 'checkFallacies', 'checkFactualConsistency'];
for (const s of PROBES) {
  const row = FNS.map(f => idx[f](s).count).join('/');
  console.log(s.slice(0, 40).padEnd(42), row);
}
console.log('---- guard legs ----');
console.log('isNeg("Not everyone",4) =', idx.isNegatedQuantifierHit('Not everyone', 4));
console.log('isNeg(idx20 distant) =', idx.isNegatedQuantifierHit('It is not true that everyone here knows the answer', 20));
console.log("isNeg(\"Doesn't everyone\",8) =", idx.isNegatedQuantifierHit("Doesn't everyone know", 8));
console.log('isNorm([can ]) =', idx.isNormativeQuantifierHit(['', 'can ']));
console.log('isNorm([is able to ]) =', idx.isNormativeQuantifierHit(['', 'is able to ']));
console.log('isNorm([has to ]) =', idx.isNormativeQuantifierHit(['', 'has to ']));
console.log('isNorm([ever ]) =', idx.isNormativeQuantifierHit(['', 'ever ']));
console.log('isNorm([in this team ]) =', idx.isNormativeQuantifierHit(['', 'in this team ']));
console.log('isNorm([必须]) =', idx.isNormativeQuantifierHit(['', '必须']));
console.log('isNorm([这样]) =', idx.isNormativeQuantifierHit(['', '这样']));
console.log('isNorm([]) =', idx.isNormativeQuantifierHit(['', '']));
