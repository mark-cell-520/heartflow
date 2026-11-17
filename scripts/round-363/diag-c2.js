// r363-3：C2 EN 疑问句穿透分析——base=true 是否缺陷？
const path = require('path');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkQuantifierScopeShift, __internals: I } = require(path.join(ROOT, 'src', 'quantifier-scope-shift.js'));
const s = 'Every student has a mentor, so is there a mentor for every student?';
const r = checkQuantifierScopeShift(s);
console.log('结果:', JSON.stringify(r, null, 2));
console.log('\nQUESTION_TAIL_RE:', I.QUESTION_TAIL_RE);
