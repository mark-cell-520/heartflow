// 一次性诊断脚本（r363）：定位 C 组失败的测试方法学根因
// 1. A1「对每个员工都有一个工位…」删 UNIVERSAL_ZH 后仍命中——真实承重腿是哪几张表？
// 2. QUESTION 守卫（内联正则 /[吗呢？?]$/）能否提为常量注入？
// 3. IDENTITY 探针为何删 IDENTITY_ZH 仍不命中？
const path = require('path');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkQuantifierScopeShift, __internals: I } = require(path.join(ROOT, 'src', 'quantifier-scope-shift.js'));

function hit(text, inject) {
  const r = checkQuantifierScopeShift(text, inject);
  return !!(r && r.verdict && r.verdict !== 'pass');
}

const A1 = '对每个员工都有一个工位，所以存在一个工位是所有员工共用的。';
const A3 = 'Every student has a mentor, so there is a mentor for every student.';
const ID_PROBE = '所有学生都有一位导师，就是同一位资深教授。';
const Q_PROBE = '是不是每位同学都对应同一个导师呢？';

console.log('=== 1. A1 基线 ===', hit(A1));
console.log('=== 2. A1 删 UNIVERSAL_ZH ===', hit(A1, { UNIVERSAL_ZH: [] }));
console.log('=== 3. A1 删 UNIVERSAL_ZH+BARE+PERSON ===', hit(A1, { UNIVERSAL_ZH: [], UNIVERSAL_ZH_BARE: [], UNIVERSAL_ZH_PERSON: [] }));
console.log('=== 4. A1 删全部全称形（含 FOR_EVERY_ZH 正则）===', hit(A1, { UNIVERSAL_ZH: [], UNIVERSAL_ZH_BARE: [], UNIVERSAL_ZH_PERSON: [], FOR_EVERY_ZH: [] }));
console.log('=== 5. A1 删 CONCL_UNIVERSAL 全套 ===', hit(A1, { CONCL_UNIVERSAL_ZH: [], CONCL_UNIVERSAL_ZH_BARE: [] }));
console.log('=== 6. A1 删 INFER 全套 ===', hit(A1, { INFER_ZH: [], INFER_ZH_REVERSE: [] }));
console.log('=== 7. A1 删 EXIST 全套 ===', hit(A1, { EXIST_ZH: [] }));

console.log('\n=== 8. A3 (EN) 删 INFER_ZH（应为 true——EN 走 INFER_EN）===', hit(A3, { INFER_ZH: [] }));
console.log('=== 9. A3 删 INFER_EN ===', hit(A3, { INFER_EN: [] }));

console.log('\n=== 10. ID_PROBE 基线 ===', hit(ID_PROBE));
console.log('=== 11. ID_PROBE 删 IDENTITY_ZH ===', hit(ID_PROBE, { IDENTITY_ZH: [] }));
console.log('    （探针无推断桥 → 无 clause 进入腿②，删守卫不翻转）');

console.log('\n=== 12. Q_PROBE 基线 ===', hit(Q_PROBE));
// Q_PROBE 含「呢？」句尾 → 内联正则守卫。试删各常量看能否翻命中
for (const k of ['IDENTITY_ZH', 'NEG_ZH', 'CONDITIONAL_ZH', 'META_CONCEPT', 'HEDGE_ZH', 'EXIST_ZH', 'CONCL_UNIVERSAL_ZH']) {
  console.log(`    Q_PROBE 删 ${k} ===`, hit(Q_PROBE, { [k]: [] }));
}
console.log('=== 13. __internals 键清单 ===');
console.log(Object.keys(I).join(', '));
