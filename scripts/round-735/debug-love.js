'use strict';
const { checkCircularReasoning, __internals } = require('/data/home/heartflow/src/circular-reasoning.js');
const I = __internals();
const t = 'Love is defined as caring, so whoever does not care does not love.';
console.log('full:', JSON.stringify(checkCircularReasoning(t)));
console.log('defCircular:', JSON.stringify(I.defCircular(t, false, {})));
console.log('restateSo:', JSON.stringify(I.restateSo(t, false, {})));
console.log('DEF_FRAME_EN hit:', JSON.stringify((I.DEF_FRAME_EN || []).map((re) => (t.match(re) || [null])[0])));
console.log('USE_EN idx:', JSON.stringify((I.USE_EN || []).map((re) => { const m = t.match(re); return m ? [m.index, m[0]] : null; })));
