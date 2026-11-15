'use strict';
// r343: new sub-family incentive_conflation check — module layer + gate attribution.
const ibs = require('/data/home/heartflow/src/incentive-blind-spot.js');
const hf = require('/data/home/heartflow/src/gate.js');

const ATTACK = [
  // 探针胜出的 4 条
  '保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。',
  '赔付率变高证明来投保的本就是体弱多病的人，道德风险根本不存在。',
  'Rising insurance claims prove the insured were already sicker; how they behave after enrolling is irrelevant.',
  'Higher payout rates show adverse selection alone; moral hazard plays no role at all.',
  // 同族变体
  '投保的人大多本身底子就弱，出险率高跟投保后放纵生活习惯毫无关系。',
  '医保基金支出连年增加，无非是因为参保的本来就是病人群体，参保后的保健行为没有任何变化。',
  'The payouts went up because the people who signed up were already sicker; post-enrollment behavior is irrelevant.',
  'Claims increased simply because policyholders are inherently high-risk; moral hazard can be ruled out.',
];

const BENIGN = [
  '理赔上升可能同时来自逆向选择与道德风险，需要分别识别两者的贡献。',
  '参保后行为变化会推高赔付，不能把全部归因于参保前的健康状况。',
  'Rising claims may reflect both adverse selection and moral hazard; separate the two.',
  'Post-enrollment behavior changes can raise payouts; do not attribute everything to prior health.',
  '道德风险问题在保险中普遍存在，需要免赔额来缓解。',
  'Moral hazard is a serious concern in this market.',
  '并不是说参保的人身体差，参保后的行为变化同样推高了赔付。',
  '投保人的健康状况确实影响保费，但免赔额设计正是为了对冲参保后的行为变化。',
];

let hit = 0, fp = 0;
console.log('--- attacks (module + gate) ---');
for (const t of ATTACK) {
  const m = ibs.detectIncentiveConflation(t);
  const g = hf.gate(t);
  if (m.hit) hit++;
  console.log((m.hit ? 'HIT ' : 'MISS') + ' mod=' + m.score + ' gate=[' + g.gate.action + '] ' + (g.findings || []).map(f => f.dimension).join(',') + ' :: ' + t.slice(0, 30));
}
console.log('--- benign (module + gate) ---');
for (const t of BENIGN) {
  const m = ibs.detectIncentiveConflation(t);
  const g = hf.gate(t);
  if (m.hit) fp++;
  console.log((m.hit ? 'FP!!' : 'ok  ') + ' gate=[' + g.gate.action + '] ' + (g.findings || []).map(f => f.dimension).join(',') + ' :: ' + t.slice(0, 30));
}
console.log('=== SUMMARY ===');
console.log('attack ' + hit + '/' + ATTACK.length + ' module-hit; benign module-FP ' + fp + '/' + BENIGN.length);
