// r358 probe-6：最小复现 verb 正则失配
'use strict';
const RE = /\b(?:differ(?:s|ent|ences)?|var(?:y|ies|iance)|higher|lower|greater|larger|smaller|average(?:s)?|more|less|gaps?|spread|disparit(?:y|ies)|percentage[- ]points?)\b/i;
const CASES = [
  'Studies show a 2.5x difference in reaction time between the two age brackets.',
  'Longitudinal data indicates a 20% difference in retention between the two cohorts.',
  'The rate differs between groups.',
  'a 2.5x difference',
  'difference',
  'differs',
  'differences',
  'gaps',
  'variance',
];
for (const c of CASES) {
  const m = c.match(RE);
  console.log(`${JSON.stringify(c)} → ${m ? 'MATCH "' + m[0] + '"' : 'no'}`);
}
