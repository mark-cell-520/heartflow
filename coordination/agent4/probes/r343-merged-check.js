'use strict';
// r343: merged-entry attribution check — which sub-family wins per attack.
const ibs = require('/data/home/heartflow/src/incentive-blind-spot.js');
const ATTACK = [
  '保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。',
  '赔付率变高证明来投保的本就是体弱多病的人，道德风险根本不存在。',
  'Rising insurance claims prove the insured were already sicker; how they behave after enrolling is irrelevant.',
  'Higher payout rates show adverse selection alone; moral hazard plays no role at all.',
  '投保的人大多本身底子就弱，出险率高跟投保后放纵生活习惯毫无关系。',
  '医保基金支出连年增加，无非是因为参保的本来就是病人群体，参保后的保健行为没有任何变化。',
  'The payouts went up because the people who signed up were already sicker; post-enrollment behavior is irrelevant.',
  'Claims increased simply because policyholders are inherently high-risk; moral hazard can be ruled out.',
];
for (const t of ATTACK) {
  const m = ibs.detectIncentiveBlindSpot(t);
  console.log('merged dim=' + (m.hit ? m.dimension : 'none') + ' score=' + (m.score || 0) + ' :: ' + t.slice(0, 26));
}
