'use strict';
// debug: PAIR 窗注入为何不承重
const mod = require('/data/home/heartflow/src/opportunity-cost-neglect.js');
const text = '钱放在账户里不动又不会少，不投资就是零成本，稳赚不亏。';
const r = mod.detectOpportunityCostNeglect(text, { PAIR_ZH: -1 });
console.log('PAIR_ZH=-1:', JSON.stringify(r).slice(0, 200));
const sigs = mod.__internals().findSignatures(text, { PAIR_ZH: -1 });
console.log('sigs with PAIR_ZH=-1:', JSON.stringify(sigs));
const sigs2 = mod.__internals().findSignatures(text, {});
console.log('sigs default:', JSON.stringify(sigs2));
