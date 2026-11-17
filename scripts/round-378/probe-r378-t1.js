const mod = require('../../src/relative-risk-individual-transfer.js');
const t = '群体的相对风险降到三成，落到每个人头上也是三成';
console.log('hit=' + mod.checkRelativeRiskIndividualTransfer(t).hit);
console.log('idx of ，=' + t.indexOf('，'));
console.log('idx of 落到=' + t.indexOf('落到'));
console.log('idx of 每个人=' + t.indexOf('每个人'));
console.log('三成 idx=' + t.indexOf('三成'));
