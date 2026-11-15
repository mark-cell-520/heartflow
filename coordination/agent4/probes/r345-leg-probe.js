'use strict';
// r345 module-level leg probe: which exact sub-forms penetrate in
// incentive_conflation mirror leg groups (candidate D).
const m = require('/data/home/heartflow/src/incentive-blind-spot.js');
const D = [
  '理赔金额上升，归根到底在于参保后大家疏于保健，跟投保前的风险构成没有任何关系。',
  '赔付率走高的问题出在参保后的生活习惯，参保前的健康结构无关紧要。',
  '医疗费用激增，根源在于参保后的放纵行为，投保时的健康池构成可以忽略。',
  'The rise in claims ultimately comes down to post-enrollment neglect; the pre-enrollment risk composition is irrelevant.',
  'The payout increase traces back to behavior after enrolling; the health pool of those who signed up can be disregarded.',
];
for (const t of D) {
  const r = m.detectIncentiveConflation(t);
  console.log((r.hit ? 'HIT ' : 'miss') + ' :: ' + t.slice(0, 30));
}
console.log('--- leg-level checks (current regexes) ---');
const I = m.__internals();
console.log('ZH leg2 A on 风险构成没有任何关系:', I.MIRROR_DENIAL_ZH[0].test('跟投保前的风险构成没有任何关系'));
console.log('ZH leg2 B on 健康结构无关紧要:', I.MIRROR_DENIAL_ZH[1].test('参保前的健康结构无关紧要'));
console.log('ZH leg2 B on 健康池构成可以忽略:', I.MIRROR_DENIAL_ZH[1].test('投保时的健康池构成可以忽略'));
console.log('EN leg1 any on ultimately comes down to:', I.MIRROR_ATTR_EN.some(r => r.test('The rise in claims ultimately comes down to post-enrollment neglect')));
console.log('EN leg1 any on traces back to:', I.MIRROR_ATTR_EN.some(r => r.test('The payout increase traces back to behavior after enrolling')));
console.log('EN leg2 any on health pool disregarded:', I.MIRROR_DENIAL_EN.some(r => r.test('the health pool of those who signed up can be disregarded')));
console.log('EN leg2 any on risk composition irrelevant:', I.MIRROR_DENIAL_EN.some(r => r.test('the pre-enrollment risk composition is irrelevant')));
console.log('--- candidate new regexes ---');
const NEW_ATTR_ZH = [
  ['归根到底在于', /(?:归根到底|归根结底|说到底|问题|根源|关键)(?:在于|出在|出自)/],
  ['EN ultimately/traces/stems/boils', /\b(?:ultimately|eventually)\s+comes?\s+down\s+to\b|\btraces?\s+back\s+to\b|\bstems?\s+from\b|\bboils?\s+down\s+to\b/i],
];
for (const [k, re] of NEW_ATTR_ZH) {
  console.log('new attr ZH-pattern ' + k + ' on D[0..2]:', D.slice(0, 3).map(t => re.test(t)).join(','));
}
console.log('new attr EN-pattern on D[3..4]:', D.slice(3).map(t => NEW_ATTR_ZH[1][1].test(t)).join(','));
