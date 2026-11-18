'use strict';
const I = require('/data/home/heartflow/src/circular-reasoning.js').__internals();
const t = 'Love is defined as caring, so whoever does not care does not love.';
console.log('tautEn(Love,caring):', JSON.stringify(I.tautEn('Love', 'caring', {})));
console.log('restateConcEn:', JSON.stringify(I.restateConcEn('Love', 'caring', 'whoever does not care does not love.', 'syn')));
console.log('enWords:', JSON.stringify(I.enWords('caring')), JSON.stringify(I.enWords('whoever does not care does not love.')));
console.log('enMatch(caring,care):', I.enMatch('caring','care'), 'enMatch(whoever,love):', I.enMatch('whoever','love'), 'enMatch(love,love):', I.enMatch('love','love'));
console.log('enStem(Love):', I.enStem('Love'));
