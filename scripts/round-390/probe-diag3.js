const M = require('../../src/carbon-leakage.js');
const I = M.__internals();
const s = '产业转移到海外，污染治理就不再是我们需要负责的事。';
console.log('NOTOURS_ZH 直接匹配:', I.NOTOURS_ZH.exec(s) ? I.NOTOURS_ZH.exec(s)[0] : 'NULL');
console.log('NOTOURS_SHIFT_ZH:', I.NOTOURS_SHIFT_ZH.exec(s) ? I.NOTOURS_SHIFT_ZH.exec(s)[0] : 'NULL');
console.log('NEG guard 词表存在?', Object.keys(I).filter(k=>/NEG|GUARD/i.test(k)).join(','));
console.log('detect:', JSON.stringify(M.detectCarbonLeakage(s)).slice(0,400));
