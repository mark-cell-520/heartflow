// r389 C5/C6/C7 豁免句实证：找默认豁免、注入后转命中的精确样本
'use strict';
const { detectSurrogateEndpointMisread: d } = require('../../src/surrogate-endpoint-misread.js');

const C6 = '血压一直没降下来，所以患者的心脏病风险解除了。';
console.log('C6 default hit:', d(C6).hit);

const S3 = '肿瘤标志物下降了，所以没预防到心梗。';
console.log('S3 default:', d(S3).hit, '| inject NEG:', d(S3, { NEG_ZH: /(?!)/i, NEG_EN: /(?!)/i }).hit);

const C1 = '教学案例里常把替代终点与硬终点的区别讲清楚：血压下降说明患者寿命延长。';
console.log('C5-ZH default:', d(C1).hit, '| inject CONCEPT_ZH:', d(C1, { CONCEPT_ZH: /(?!)/i }).hit);

const C2 = 'In teaching, a surrogate endpoint is distinct from a hard endpoint: blood pressure came down, which means patients live longer.';
console.log('C5-EN default:', d(C2).hit, '| inject CONCEPT_EN:', d(C2, { CONCEPT_EN: /(?!)/i }).hit);

const C3 = '这种药的糖化血红蛋白降下来了，但心血管结局试验仍需更长时间的终点数据，说明患者寿命会延长。';
console.log('CORRECT-ZH default:', d(C3).hit, '| inject CORRECT_ZH:', d(C3, { CORRECT_ZH: [/(?!)/i] }).hit);

const C4 = 'Blood pressure came down, but the hard endpoint trial is still ongoing, so patients will live longer.';
console.log('CORRECT-EN default:', d(C4).hit, '| inject CORRECT_EN:', d(C4, { CORRECT_EN: [/(?!)/i] }).hit);

const C7 = 'LDL 降下来了，但这并不意味着能预防心梗。';
console.log('C7 default:', d(C7).hit, '| inject NEG+HEDGE+CONCEPT:', d(C7, { NEG_ZH: /(?!)/i, NEG_EN: /(?!)/i, HEDGE_ZH: /(?!)/i, HEDGE_EN: /(?!)/i, CONCEPT_ZH: /(?!)/i, CONCEPT_EN: /(?!)/i }).hit);
