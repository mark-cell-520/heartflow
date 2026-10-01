// r358 probe-4：在函数级逐条验证 #5/#10 为何未被豁免
// 关键：isGroupFactDiffEn 未导出，这里按其定义复刻一份做等价验证
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src/index.js'));

const GROUP_FACT_DIFF_EN = {
  verb: /\b(?:differ(?:s|ent|ences)?|var(?:y|ies|iance)|higher|lower|greater|larger|smaller|average(?:s)?|more|less|gaps?|spread|disparit(?:y|ies)|percentage[- ]points?)\b/i,
  attribution: /\b(?:naturally|biological(?:ly)?|genetic(?:s|ally)?|born\b|hardwired|wired|DNA|inherently)\b/i,
  ranking: /\b(?:better at|worse at|best at|worst at|superior|inferior|smarter|more intelligent|less intelligent|less capable|more capable|weaker|stronger|less competent|more competent)\b/i,
};
function isGroupFactDiffEn(text) {
  const low = text.toLowerCase();
  return GROUP_FACT_DIFF_EN.verb.test(low)
    && !GROUP_FACT_DIFF_EN.attribution.test(low)
    && !GROUP_FACT_DIFF_EN.ranking.test(low);
}

const SAMPLES = {
  N5: 'Studies show a 2.5x difference in reaction time between the two age brackets.',
  N10: 'Longitudinal data indicates a 20% difference in retention between the two cohorts.',
};

for (const [k, t] of Object.entries(SAMPLES)) {
  const low = t.toLowerCase();
  const verb = GROUP_FACT_DIFF_EN.verb.test(low);
  const attr = GROUP_FACT_DIFF_EN.attribution.test(low);
  const rank = GROUP_FACT_DIFF_EN.ranking.test(low);
  console.log(`${k}: verb=${verb} attribution=${attr} ranking=${rank} → gfd=${isGroupFactDiffEn(t)}`);
  const uc = idx.checkUnsupportedClaim(t);
  console.log(`    unsupported_claim: count=${uc.count} score=${uc.score}`);
  const aa = idx.checkAppealToAuthority(t);
  console.log(`    appeal_to_authority: count=${aa.count} score=${aa.score}`);
  const vg = idx.checkVagueness(t);
  console.log(`    vagueness: count=${vg.count} score=${vg.score}`);
}
