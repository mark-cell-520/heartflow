// r363-5：A1「对每个员工都有一个工位，所以存在一个工位是所有员工共用的。」
// 的腿①真实承重定位——逐表删 + 全删组合。
const path = require('path');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkQuantifierScopeShift, __internals: I } = require(path.join(ROOT, 'src', 'quantifier-scope-shift.js'));
function hit(s, inj) { const r = checkQuantifierScopeShift(s, inj); return r.verdict !== 'pass'; }
const NULL_RE = /(?!x)x/;
const A1 = '对每个员工都有一个工位，所以存在一个工位是所有员工共用的。';
const keys = Object.keys(I);
console.log('A1 base:', hit(A1));
for (const k of keys) {
  const cur = I[k];
  let inj;
  if (Array.isArray(cur)) inj = [];
  else if (cur instanceof RegExp) inj = NULL_RE;
  else inj = cur; // 标量不动
  if (Array.isArray(inj) && inj.length === 0) {
    const r = hit(A1, { [k]: inj });
    if (!r) console.log(`  删 ${k} → 翻转（承重）`);
  } else if (cur instanceof RegExp) {
    const r = hit(A1, { [k]: inj });
    if (!r) console.log(`  删 ${k}(regex) → 翻转（承重）`);
  }
}
// 组合删：EXIST + INFER 全删
console.log('EXIST_ZH+INFER全套删:', hit(A1, { EXIST_ZH: [], INFER_ZH: [], INFER_ZH_REVERSE: [] }));
// 保留腿②③ 全删腿①候选：UNIVERSAL*+BARE+PERSON+FOR_EVERY
console.log('腿①全删(四表+FOR_EVERY):', hit(A1, { UNIVERSAL_ZH: [], UNIVERSAL_ZH_BARE: [], UNIVERSAL_ZH_PERSON: [], FOR_EVERY_ZH: [NULL_RE] }));
console.log('腿①全删+BARE_EXIST:', hit(A1, { UNIVERSAL_ZH: [], UNIVERSAL_ZH_BARE: [], UNIVERSAL_ZH_PERSON: [], FOR_EVERY_ZH: [NULL_RE], BARE_EXIST_ZH: [] }));
console.log('腿①全删+EXIST_ZH:', hit(A1, { UNIVERSAL_ZH: [], UNIVERSAL_ZH_BARE: [], UNIVERSAL_ZH_PERSON: [], FOR_EVERY_ZH: [NULL_RE], EXIST_ZH: [] }));
// 腿④谓域共享判据：A1 谓域「工位」前提侧与结论侧相同 → 命中；构造谓域不重叠攻击形
console.log('谓域不重叠攻击形:', hit('对每个员工都发了一顶帽子，所以存在一顶帽子是所有员工共用的。'));
