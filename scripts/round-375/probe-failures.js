'use strict';
// 临时诊断：7 个失败点的逐条分解。
const path = require('path');
const ROOT = '/data/home/heartflow';
const { detectGovernmentHouseholdAnalogy: detect } = require(path.join(ROOT, 'src', 'government-household-analogy.js'));
const { __internals } = require(path.join(ROOT, 'src', 'government-household-analogy.js'));
const I = __internals();

const t1 = '主权政府如同家庭一样有借有还，债务到期不能赖，否则就是资不抵债。';
console.log('A1 miss 样本：主权政府如同家庭一样有借有还，债务到期不能赖，否则就是资不抵债。');
console.log('  SOV_ZH=' + I.SOV_ZH.test(t1) + ' ANALOGY_ZH=' + I.ANALOGY_ZH.test(t1) + ' PAYOFF_ZH=' + I.PAYOFF_ZH.test(t1));
const an = t1.match(I.ANALOGY_ZH);
console.log('  ANALOGY match=' + (an ? JSON.stringify(an[0]) : 'null'));
const po = t1.match(I.PAYOFF_ZH);
console.log('  PAYOFF match=' + (po ? JSON.stringify(po[0]) : 'null') + ' idx=' + (po ? po.index : -1));

const t2 = 'The claim that a government works just like a household budget is a classic fallacy, but in truth the debt must be paid off in full or the country goes bankrupt.';
console.log('\nD1b EN CONCEPT 样本：');
console.log('  CONCEPT_EN=' + I.CONCEPT_EN.test(t2));
console.log('  base hit=' + detect(t2).hit);
console.log('  inj CONCEPT_EN=[] hit=' + detect(t2, { CONCEPT_EN: [] }).hit);
// CONCEPT_EN 与 fallback 注释冲突——fallacy 与 household 相距多远？
const m = t2.match(I.CONCEPT_EN);
console.log('  CONCEPT_EN match=' + (m ? JSON.stringify(m[0]) : 'null'));

const t3 = '政府跟家庭一样要过日子，但并不意味着债台高筑就会破产。';
console.log('\nNEG_ZH/HEDGE_ZH 样本：');
const p3 = t3.match(I.PAYOFF_ZH);
console.log('  PAYOFF=' + (p3 ? JSON.stringify(p3[0]) + ' idx=' + p3.index : 'null'));
const before12 = t3.slice(Math.max(0, (p3 ? p3.index : 0) - 12), p3 ? p3.index : 0);
console.log('  before12=' + JSON.stringify(before12) + ' NEG_ZH=' + I.NEG_ZH.test(before12));
const before20 = t3.slice(Math.max(0, (p3 ? p3.index : 0) - 20), p3 ? p3.index : 0);
console.log('  before20=' + JSON.stringify(before20) + ' HEDGE_ZH=' + I.HEDGE_ZH.test(before20));
console.log('  inj NEG_ZH=[] hit=' + detect(t3, { NEG_ZH: [] }).hit + ' inj HEDGE_ZH=[] hit=' + detect(t3, { HEDGE_ZH: [] }).hit);

const t4 = 'The government works like a household budget, but that does not mean it will go bankrupt.';
console.log('\nNEG_EN/HEDGE_EN 样本：');
const p4 = t4.match(I.PAYOFF_EN);
console.log('  PAYOFF=' + (p4 ? JSON.stringify(p4[0]) + ' idx=' + p4.index : 'null'));
const before24 = t4.slice(Math.max(0, (p4 ? p4.index : 0) - 24), p4 ? p4.index : 0);
console.log('  before24=' + JSON.stringify(before24));
const before40 = t4.slice(Math.max(0, (p4 ? p4.index : 0) - 40), p4 ? p4.index : 0);
console.log('  before40=' + JSON.stringify(before40) + ' HEDGE_EN=' + I.HEDGE_EN.test(before40) + ' NEG_EN=' + I.NEG_EN.test(before24));
