/** r534：#8 / #9 两支的最终定位：OWN 与 INVERT 双侧逐条测。 */
'use strict';
const { checkPerformativeResponsibility, __internals } = require('../src/performative-responsibility.js');
const { OWN_ZH, OWN_EN, INVERT_ZH, INVERT_EN, EXEMPT_ZH, EXEMPT_EN } = __internals();

const cases = [
  'You forced my hand, so whatever happens is on you.',
  '你们赢了，全是我的责任，你们从来只会计较这些。',
  // 形状片段（不含完整句）
  'You forced my hand',
  'so whatever happens is on you',
  '全是我的责任',
  '你们从来只会计较这些',
  '只会计较这些',
  '计较这些',
  '计较得失',
];
cases.forEach((s, i) => {
  console.log(`#${i} hit=${checkPerformativeResponsibility(s).hit} ownZH=${OWN_ZH.test(s)} ownEN=${OWN_EN.test(s)} invZH=${INVERT_ZH.test(s)} invEN=${INVERT_EN.test(s)} exZ=${EXEMPT_ZH.test(s)}`);
});
