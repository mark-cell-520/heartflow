'use strict';
// 用 read_file 已知的样本形状，直接验证 EN 支为何漏（只跑正则可判性）
const path = require('node:path');
const I = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js')).__internals();

// 英文攻击样本形状（来自探针，仅作判据验证，不入报告）
const enShapes = [
  'it was not a real injury , she was imagining the whole thing .',
  'he is not actually suffering , that is just anxiety talking .',
  'nobody is really worse off here , so there is nothing to settle .',
];
console.log('EN deny:');
for (const [i, s] of enShapes.entries()) {
  console.log(`  #${i} DENY_EN=${I.HARM_DENY_EN.test(s)} MIN_EN=${I.MINIMIZE_EN.test(s)}`);
}
