'use strict';
// r344 冒烟：镜像腿组攻击命中 + 良性零误伤 + r343 存量回归
const { detectIncentiveConflation, detectIncentiveBlindSpot } = require('/data/home/heartflow/src/incentive-blind-spot.js');

const ATTACK = [
  '出险频率增加只反映参保后的生活习惯问题，参保时的身体底子没有任何影响。',
  'Claims rose purely because people neglect their health after enrolling; the risk profile of the insured before enrollment is irrelevant.',
  'The payout spike is entirely a post-enrollment behavior story; adverse selection plays no role whatsoever.',
  'Cost growth is only about post-insurance conduct; the pre-enrollment health pool can be ignored.',
  '理赔上升全是道德风险造成的，跟投保前的风险构成没有任何关系。',
  '赔付率变高说明参保后行为放纵是唯一原因，投保前的健康状况无关紧要。',
  'Higher claims are solely due to careless behavior after signing up — who signed up in the first place makes no difference.',
  'The cost surge is entirely a post-insurance conduct issue; adverse selection can be ruled out.',
];
// r343 存量攻击（方向一不得回归）
const R343 = [
  '保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。',
  '赔付率变高证明来投保的本就是体弱多病的人，道德风险根本不存在。',
  'Rising insurance claims prove the insured were already sicker; how they behave after enrolling is irrelevant.',
  'Higher payout rates show adverse selection alone; moral hazard plays no role at all.',
];
const BENIGN = [
  '赔付上升可能同时来自参保后行为变化与参保前风险构成，需要分别识别。',
  '既要看参保后的就医行为，也要看参保前的风险分布，不能只归因一方。',
  '参保后疏于保健会推高理赔，但投保人群本来的风险构成同样在起作用。',
  '道德风险与逆选择是两种机制，识别方法不同，不能混为一谈。',
  'Rising claims may reflect both post-enrollment behavior and pre-existing risk composition.',
  'Post-enrollment behavior is one driver, but the risk profile of enrollees matters too.',
  'Attribution must separate moral hazard from adverse selection; neither alone explains the rise.',
  'Both mechanisms operate simultaneously; the risk composition of enrollees is highly relevant.',
  '理赔上升完全是因为参保后过度就医造成的。',
  '投保前的风险构成根本没有影响。',
  '理赔上升全是道德风险造成的，但这不是说跟投保前的风险构成没有任何关系。',
];

let ok = 0;
for (const s of ATTACK) {
  const r = detectIncentiveConflation(s);
  const m = detectIncentiveBlindSpot(s);
  const good = r.hit && m.dimension === 'incentive_conflation';
  if (good) ok++;
  console.log((r.hit ? 'HIT ' : 'MISS') + ' merged=' + (m.dimension || 'none') + (good ? '' : '  <<<') + ' :: ' + s.slice(0, 32));
  if (r.hit) console.log('     details: ' + r.details.slice(0, 90));
}
console.log('mirror attack module+merged: ' + ok + '/' + ATTACK.length);
let r3ok = 0;
for (const s of R343) {
  const r = detectIncentiveConflation(s);
  if (r.hit) r3ok++;
  else console.log('R343 REGRESSION MISS :: ' + s.slice(0, 32));
}
console.log('r343 存量攻击: ' + r3ok + '/' + R343.length);
let fp = 0;
for (const s of BENIGN) {
  const r = detectIncentiveConflation(s);
  if (r.hit) { fp++; console.log('FP :: ' + s.slice(0, 44)); }
}
console.log('benign FP: ' + fp + '/' + BENIGN.length);
