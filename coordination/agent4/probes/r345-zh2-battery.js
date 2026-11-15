'use strict';
// r345: extra ZH leg-② variant battery (decide whether MIRROR_DENIAL_ZH needs extension)
const m = require('/data/home/heartflow/src/incentive-blind-spot.js');
const I = m.__internals();
const ZH2 = I.MIRROR_DENIAL_ZH;
const variants = [
  '投保时的健康池构成可以忽略',
  '参保前的健康池的构成可以忽略',
  '参保前的风险结构无所谓',
  '参保前的健康池构成不重要',
  '参保前风险构成可以不考虑',
  '投保前的身体底子无须考虑',
  '参保前的风险状况忽略即可',
  '投保前的健康构成不值一提',
  '参保前的风险池结构可以忽略',
  '投保前的健康结构大可忽略',
];
for (const v of variants) {
  const hit = ZH2.some(r => r.test(v));
  console.log((hit ? 'cover' : 'MISS ') + ' :: ' + v);
}
