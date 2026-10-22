'use strict';
const I = require('../src/moral-licensing.js').__internals();
const targets = [
  '我平时都按规矩来，就这次例外一下。',
  'At least I did not do worse than they did.',
];
targets.forEach((t, i) => {
  const pZ = I.PERMIT_ZH.test(t), pE = I.PERMIT_EN.test(t);
  console.log(`[${i}] perZ=${pZ?1:0} perE=${pE?1:0} len=${t.length}`);
});
