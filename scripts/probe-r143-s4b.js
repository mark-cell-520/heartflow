// S4 第二条定位：逐支比对新增 14 支判据，找出为什么仍未匹配。
'use strict';
const { REWARD_HACKING_ZH } = require('../src/reward-hacking.js');
const S = '失败的三次运行从统计里去掉，别算进均值';
const P = REWARD_HACKING_ZH.metric_denominator_gaming;
for (let i = 0; i < P.length; i++) {
  const m = S.match(P[i]);
  console.log(`#${i} ${m ? 'MATCH' : 'no   '} ${m ? JSON.stringify(m[0]) : ''}`);
}
console.log('TOTAL=' + P.length);
