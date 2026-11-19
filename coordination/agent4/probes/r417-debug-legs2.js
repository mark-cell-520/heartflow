// r417 调试2：打印 EN 正则源码并单测
'use strict';
const I = require('/data/home/heartflow/src/tu-quoque.js').__internals();
console.log('PREVALENCE_EN source:', I.PREVALENCE_EN.source.slice(0, 200));
console.log('NORMALIZE_EN source:', I.NORMALIZE_EN.source.slice(0, 200));
const t1 = "Everyone cheats on taxes, so why can't I?";
console.log('t1 prev:', I.PREVALENCE_EN.test(t1), 'norm:', I.NORMALIZE_EN.test(t1));
const re = /\b(?:everyone|everybody)\b[^.]{0,30}?\b(?:cheat)\w*\b/i;
console.log('hand-written re on t1:', re.test(t1));
