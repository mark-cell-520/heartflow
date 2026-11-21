// 一次性诊断：打印 src/regression-to-the-mean.js 存量数组实测长度
'use strict';
const { __internals } = require('/data/home/heartflow/src/regression-to-the-mean.js');
const I = __internals();
for (const k of ['EXTREME_LOW_ZH', 'EXTREME_HIGH_ZH', 'REG_DOWN_ZH', 'REG_DOWN_EN', 'REG_UP_ZH', 'REG_UP_EN',
  'INTERVENE_ZH', 'INTERVENE_EN', 'CREDIT_ZH', 'CREDIT_EN', 'EFFECT_ZH', 'EFFECT_EN',
  'EXEMPT_NEG_ZH', 'EXEMPT_NEG_EN', 'FB_INTERVENE_ZH', 'FB_INTERVENE_EN', 'FB_ATTRIB_ZH', 'FB_ATTRIB_EN',
  'NEG_EFFECT_ZH', 'NEG_EFFECT_EN', 'JINX_EXT_ZH', 'JINX_REG_ZH', 'JINX_NAME_ZH', 'JINX_EXT_EN', 'JINX_REG_EN', 'JINX_NAME_EN']) {
  console.log(k + '=' + I[k].length);
}
