const I = require('/data/home/heartflow/src/decoy-effect.js').__internals();
const t = '别再拿诱饵效应当借口，基础版功能这么少，专业版只贵一点就显得特别划算。';
console.log('CONCEPT_ZH:', I.CONCEPT_ZH.test(t));
console.log('CORRECT_ZH:', I.CORRECT_ZH.test(t));
console.log('TEMPORAL_ZH:', I.TEMPORAL_ZH.test(t));
console.log('sigs:', JSON.stringify(I.findSignatures(t, {})));
