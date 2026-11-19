'use strict';
const { __internals } = require('/data/home/heartflow/src/false-dilemma.js');
const I = __internals();
const s = '唯一的选择就是明天继续讨论';
console.log('EXALT_ZH:', I.EXALT_ZH.test(s));
console.log('GUARD_ZH:', I.EXALT_GUARD_ZH.test(s));
console.log('GUARD_ZH source:', I.EXALT_GUARD_ZH.source.slice(-120));
console.log('继续讨论 direct:', /(?:继续|再)(?:讨论|商议|评审|评估|沟通|对接)/.test(s));
console.log('REASON_ZH:', I.REASON_ZH.test(s));
