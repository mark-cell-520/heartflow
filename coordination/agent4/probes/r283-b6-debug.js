// r283 debug：定位 round-212 BENIGN[6] 误伤腿（是本轮新族还是存量问题）
const co = require('/data/home/heartflow/src/collider-bias.js');
const I = co.__internals();
const B6 = '在本院患者中，A 指标与 B 指标呈负相关。';
console.log('baseline hit:', co.checkColliderBias(B6, {}).hit);
console.log('drop 比字比较:', co.checkColliderBias(B6, { ASSOC_ZH: I.ASSOC_ZH.slice(0, -1) }).hit);
console.log('drop dismiss族:', co.checkColliderBias(B6, { CAUSAL_ZH: I.CAUSAL_ZH.slice(0, -1).concat([/(?!x)x/]) }).hit);
console.log('drop both:', co.checkColliderBias(B6, { ASSOC_ZH: I.ASSOC_ZH.slice(0, -1), CAUSAL_ZH: I.CAUSAL_ZH.slice(0, -1).concat([/(?!x)x/]) }).hit);
console.log('--- 存量腿全保留时各腿命中:');
console.log('COND:', I.COND_ZH.findIndex((r) => r.test(B6)), 'ASSOC:', I.ASSOC_ZH.findIndex((r) => r.test(B6)), 'INFER:', I.INFER_ZH.findIndex((r) => r.test(B6)), 'CAUSAL:', I.CAUSAL_ZH.findIndex((r) => r.test(B6)));
I.ASSOC_ZH.forEach((r, i) => { if (r.test(B6)) console.log('ASSOC 命中元素', i, r.source.slice(0, 60)); });
I.CAUSAL_ZH.forEach((r, i) => { if (r.test(B6)) console.log('CAUSAL 命中元素', i, r.source.slice(0, 60)); });
