'use strict';
const M = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/loyalty-by-omission.js');
const K = M.__internals();
const { DEMEAN_EN, EXEMPT_EN, EQUATE_LINK_EN } = K;
const s = 'If you refuse to cooperate, that makes you the enemy.';
console.log('demean:', DEMEAN_EN.test(s));
console.log('link:', EQUATE_LINK_EN.test(s));
console.log('exempt:', EXEMPT_EN.test(s));
console.log('full:', JSON.stringify(M.checkLoyaltyByOmission(s)));
