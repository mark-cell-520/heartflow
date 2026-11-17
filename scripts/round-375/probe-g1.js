'use strict';
// 临时探查：g1 攻击句在 gate 层的归因维度（验证是否本族增量）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const { detectGovernmentHouseholdAnalogy } = require(path.join(ROOT, 'src', 'government-household-analogy.js'));
const t = '对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。';
const g1 = gate(t);
console.log('action=' + g1.gate.action + ' dims=' + JSON.stringify((g1.findings || []).map(f => f.dimension)));
console.log('本族直接命中=' + detectGovernmentHouseholdAnalogy(t).hit);
