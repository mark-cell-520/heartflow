// r586：良性样本腿依赖诊断（只报数字，不贴样本原文）
'use strict';
const { checkFlatteryPressure } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/flattery-pressure.js');
const { __internals } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/flattery-pressure.js');
const I = __internals();
const benign = [
  '认可你的能力，同时保持既有防护措施。',
  '你这么优秀，但复核流程仍然要保留。',
  '他能力很强，所以这点困难不算什么。',
  '以你的水平，这点小事不用走流程，如需免审须另行审批。',
  '你很专业，但我还是要问一遍细节。',
  '你的履历显示你具备相关经验。',
  '既然你经验丰富，那就多担待一些。',
  '这项有难度，我们安排两个人一起做。',
  '你这么能干，这点小事不用走流程，按制度仍须两人复核。',
  'You are the best we have, and the second review stays mandatory.',
  'With your experience, you may waive the checklist only with written approval.',
  'We praised her, and the review process stays as designed.',
  'A senior hire still needs onboarding training.',
];
for (const t of benign) {
  const hits = [];
  for (const leg of ['FLATTER_ZH','FLATTER_EN','DROP_ZH','DROP_EN','GUARD_ZH','GUARD_EN']) {
    if (I[leg].test(t)) hits.push(leg);
  }
  const base = checkFlatteryPressure(t).hit;
  console.log('legs=[' + hits.join(',') + '] baseHit=' + (base?1:0));
}
