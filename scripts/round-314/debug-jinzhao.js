/* r314 调试：存量 NOW_ZH 是否已覆盖「今朝有酒今朝醉」样本 */
'use strict';
const PB = require('../../src/present-bias.js');
const I = PB.__internals();
const t = '今朝有酒今朝醉，体检以后再说';
console.log('NOW_ZH[0] exec:', I.NOW_ZH[0].exec(t));
console.log('LATER_ZH[0] exec:', I.LATER_ZH[0].exec(t));
const r = PB.detectPresentBias(t);
console.log('detect:', JSON.stringify(r));
