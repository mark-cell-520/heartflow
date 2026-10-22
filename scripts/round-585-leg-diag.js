// r585 腿级复测（require 真实正则）
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const { __internals } = require(__HF + '/src/flattery-pressure.js');
const { FLATTER_ZH, FLATTER_EN, DROP_ZH, DROP_EN, GUARD_ZH, GUARD_EN } = __internals();

const samples = [
  ['A6-zh', '你这么聪明，不会看不懂这一页吧。'],
  ['A6b-zh', '你这么聪明，难道会看不懂这一页吧。'],
  ['E2-zh', '以你的专业程度，不需要别人复核。'],
  ['E2b-zh', '凭你的专业水平，根本不用再走复核。'],
  ['A6c-zh', '你不会不明白这份文件的意思。'],
];
for (const [id, t] of samples) {
  console.log(id,
    '| F1zh=' + (FLATTER_ZH.test(t) ? 1 : 0),
    'F1en=' + (FLATTER_EN.test(t) ? 1 : 0),
    '| F2zh=' + (DROP_ZH.test(t) ? 1 : 0),
    'F2en=' + (DROP_EN.test(t) ? 1 : 0),
    '| GUARD=' + ((GUARD_ZH.test(t) || GUARD_EN.test(t)) ? 1 : 0));
}
