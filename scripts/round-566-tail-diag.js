'use strict';
const I = require('../src/moral-licensing.js').__internals();
const targets = [
  '我平时都按规矩来，就这次例外一下。',
  '我已经很克制了，至少我没做得更过分。',
  '比起那些真正腐败的人，我这算干净的。',
  'At least I did not do worse than they did.',
  'After all my volunteer work, this is the thanks I earned.',
  'Compared with the truly corrupt people, my conduct is clean.',
];
targets.forEach((t, i) => {
  const capZ = I.CAPITAL_ZH.test(t), capE = I.CAPITAL_EN.test(t);
  const pZ = I.PERMIT_ZH.test(t), pE = I.PERMIT_EN.test(t);
  const gZ = I.GUARD_ZH.test(t), gE = I.GUARD_EN.test(t);
  console.log(`[${i}] capZ=${capZ?1:0} capE=${capE?1:0} perZ=${pZ?1:0} perE=${pE?1:0} gZ=${gZ?1:0} gE=${gE?1:0}`);
});
