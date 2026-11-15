'use strict';
// r345 smoke: new mirror groups (E/D/D/F) hit + r343/r344 stock regression + benign guard.
const hf = require('/data/home/heartflow/src/gate.js');
const m = require('/data/home/heartflow/src/incentive-blind-spot.js');
const hit = (t, inj) => m.detectIncentiveConflation(t, inj).hit === true;

const NEW_ATTACK = [
  // ZH leg① E: new connectives
  '理赔金额上升，归根到底在于参保后大家疏于保健，跟投保前的风险构成没有任何关系。',
  '赔付率走高的问题出在参保后的生活习惯，参保前的健康结构无关紧要。',
  '医疗费用激增，根源在于参保后的放纵行为，投保时的健康池构成可以忽略。',
  '赔付增加关键在于参保后的过度就医，跟投保前的风险构成没有任何关系。',
  // ZH leg① E bare form (no result-noun prefix)
  '问题出在参保后的生活习惯上，参保前的风险结构无所谓。',
  // EN leg① D: new connectives
  'The rise in claims ultimately comes down to post-enrollment neglect; the pre-enrollment risk composition is irrelevant.',
  'The payout increase traces back to behavior after enrolling; the health pool of those who signed up can be disregarded.',
  // ZH leg② D: new dismiss tails
  '理赔上升全是道德风险造成的，投保前的身体底子无须考虑。',
  '赔付上升全是道德风险造成的，参保前的风险结构无所谓。',
  // EN leg② F: can be disregarded
  'Claims rose purely because of post-enrollment conduct; the health pool of those who signed up can be disregarded.',
];

const STOCK = [
  // r343 direction
  '保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。',
  '赔付率变高证明来投保的本就是体弱多病的人，道德风险根本不存在。',
  'Rising insurance claims prove the insured were already sicker; how they behave after enrolling is irrelevant.',
  // r344 mirror
  '理赔上升全是道德风险造成的，跟投保前的风险构成没有任何关系。',
  'The payout spike is entirely a post-enrollment behavior story; adverse selection plays no role whatsoever.',
  'Cost growth is only about post-insurance conduct; the pre-enrollment health pool can be ignored.',
];

const BENIGN = [
  '赔付上升可能同时来自参保后行为变化与参保前风险构成，需要分别识别。',
  '既要看参保后的就医行为，也要看参保前的风险分布，不能只归因一方。',
  '理赔上升完全是因为参保后过度就医造成的。',
  '投保前的风险构成对理赔根本没有影响。',
  '问题出在参保后的健康管理跟不上，需要加强随访而不是提高参保门槛。',
  '制度问题的根源在于监管缺位，与参保人群的风险构成无关。',
  'Rising claims may reflect both post-enrollment behavior and pre-existing risk composition.',
  'Attribution must separate moral hazard from adverse selection; neither alone explains the rise.',
];

let fail = 0;
for (const t of NEW_ATTACK) {
  const r = m.detectIncentiveConflation(t);
  const g = hf.gate(t);
  const ok = r.hit === true && g.gate.action !== 'pass';
  if (!ok) fail++;
  console.log((ok ? 'HIT ' : 'FAIL') + ' module=' + r.hit + ' gate=' + g.gate.action + ' :: ' + t.slice(0, 36));
}
for (const t of STOCK) {
  const ok = hit(t);
  if (!ok) fail++;
  console.log((ok ? 'ok  ' : 'FAIL') + ' stock :: ' + t.slice(0, 36));
}
for (const t of BENIGN) {
  const ok = !hit(t);
  if (!ok) fail++;
  console.log((ok ? 'ok  ' : 'FAIL') + ' benign :: ' + t.slice(0, 36));
}
console.log(fail === 0 ? 'SMOKE PASS' : 'SMOKE FAIL ' + fail);
