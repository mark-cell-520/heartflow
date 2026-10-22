// r568 决定性检查 2：确认两条 EN 补支是否真的在 CAPITAL_EN.source 里。
'use strict';
const ml = require('../src/moral-licensing.js');
const cap = ml.__internals();
const s = cap.CAPITAL_EN.source;
console.log('source 总长度:', s.length);
console.log('含 "have\\\\s+(?:a|an)":', s.includes('have\\s+(?:a|an)'));
console.log('含 "volunteering":', s.includes('volunteering'));
console.log('最后 60 字符:', JSON.stringify(s.slice(-60)));
