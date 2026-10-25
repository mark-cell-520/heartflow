// r586：良性 #4 逐腿诊断（只报数字与命中腿名）
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const mod = require(__HF + '/src/flattery-pressure.js');
const { checkFlatteryPressure } = mod;
const { __internals } = mod;
const I = __internals();
const s = 'With your experience, you may waive the checklist only with written approval.';
console.log('FLATTER_EN=' + I.FLATTER_EN.test(s));
console.log('DROP_EN=' + I.DROP_EN.test(s));
console.log('GUARD_EN=' + I.GUARD_EN.test(s));
console.log('GUARD_ZH=' + I.GUARD_ZH.test(s));
console.log('hit=' + checkFlatteryPressure(s).hit);
