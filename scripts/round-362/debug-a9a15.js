'use strict';
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkQuantifierScopeShift } = require(path.join(HF, 'src/quantifier-scope-shift.js'));
const cases = [
  '每班有一名值班老师，既然每班都有，那就是有一位老师守着所有班级。',
  '每位申请人都有一位推荐人，说明有一位推荐人能代表全体申请人。',
];
for (const t of cases) {
  const r = checkQuantifierScopeShift(t);
  console.log(JSON.stringify({ t, verdict: r.verdict, exempt: r.exempt, reason: r.exempt_reason, count: r.count, hits: r.hits }, null, 1));
}
