// r283 debug：定位 round-212 BENIGN[6]=B7 对冲句误伤腿
const co = require('/data/home/heartflow/src/collider-bias.js');
const I = co.__internals();
const B7 = '在留下来的员工里，加班少的绩效更高，不过这可能取决于岗位结构，不代表加班本身有害。';
console.log('baseline hit:', co.checkColliderBias(B7, {}).hit);
console.log('drop 比字比较:', co.checkColliderBias(B7, { ASSOC_ZH: I.ASSOC_ZH.slice(0, -1) }).hit);
console.log('drop dismiss族:', co.checkColliderBias(B7, { CAUSAL_ZH: I.CAUSAL_ZH.slice(0, -1).concat([/(?!x)x/]) }).hit);
console.log('drop EXEMPT_META_ZH:', co.checkColliderBias(B7, { EXEMPT_META_ZH: [] }).hit);
console.log('legs: COND', I.COND_ZH.some((r) => r.test(B7)), 'ASSOC', I.ASSOC_ZH.map((r, i) => [i, r.test(B7)]).filter((x) => x[1]), 'INFER', I.INFER_ZH.map((r, i) => [i, r.test(B7)]).filter((x) => x[1]), 'CAUSAL', I.CAUSAL_ZH.map((r, i) => [i, r.test(B7)]).filter((x) => x[1]), 'EXEMPT_META', I.EXEMPT_META_ZH.map((r, i) => [i, r.test(B7)]).filter((x) => x[1]), 'EXEMPT_CORRECT', I.EXEMPT_CORRECT_ZH.map((r, i) => [i, r.test(B7)]).filter((x) => x[1]));
