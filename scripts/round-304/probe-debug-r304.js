// probe-debug-r304.js — 诊断两条未命中攻击的腿级原因
'use strict';
const path = require('path');
const { checkWeakEvidenceStrongClaim, __internals } = require(path.resolve(__dirname, '../../src/weak-evidence-strong-claim.js'));
const C = __internals();

const t1 = '网上都在传这个课程包治百病，效果特别好。';
console.log('--- t1:', t1);
console.log('hit:', checkWeakEvidenceStrongClaim(t1).hit);
console.log('EVIDENCE_ZH 都在传:', C.EVIDENCE_ZH.filter(r => r.test(t1)).map(r => r.source));
console.log('STRENGTH_ZH 包治:', C.STRENGTH_ZH.filter(r => r.test(t1)).map(r => r.source));
for (const k of ['EXEMPT_CORRECT_ZH', 'EXEMPT_META_ZH', 'EXEMPT_SOURCED_ZH']) {
  console.log(k + ':', C[k].filter(r => r.test(t1)).map(r => r.source));
}
console.log('HEDGE_ZH:', C.HEDGE_ZH.test(t1), '问号:', /[?？]/.test(t1));
