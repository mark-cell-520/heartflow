'use strict';
const I = require('/data/home/heartflow/src/circular-reasoning.js').__internals();
console.log('src:', I.enMatch.toString());
console.log('caring/care:', I.enMatch('caring', 'care'));
console.log('caring/cares:', I.enMatch('caring', 'cares'));
console.log('wisdom/wise:', I.enMatch('wisdom', 'wise'));
console.log('enStem(caring):', I.enStem('caring'), 'enStem(care):', I.enStem('care'));
