#!/usr/bin/env node
'use strict';
/* r362 调试4：弯引号样本模块层为何 miss + 三个残留缺口定位 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const wr = require(path.join(ROOT, 'src', 'will-rogers-phenomenon.js'));
const I = wr.__internals();

const curly = 'Re-stratifying the patients moved some between stages, and both stages\u2019 survival rose.';
const straight = "Re-stratifying the patients moved some between stages, and both stages' survival rose.";
console.log('curly sigs:', JSON.stringify(I.findSignatures(curly)));
console.log('straight sigs:', JSON.stringify(I.findSignatures(straight)));

// 逐腿诊断三个残留样本
const samples = [
  'Once the tiers were redrawn, scores rose for everyone.',
  '调整分班之后，两个班的分数连创新高',
  'Re-binning the students by the new rule improved both groups.',
];
for (const s of samples) {
  console.log('TEXT:', s);
  console.log('  sigs:', JSON.stringify(I.findSignatures(s)));
  // 逐族命中
  for (const [name, defs] of I.MIGRATE_EN_GROUPS) {
    for (const re of defs) if (re.test(s)) console.log('    leg1 HIT', name);
  }
  for (const [name, defs] of I.BOTHUP_EN_GROUPS) {
    for (const re of defs) if (re.test(s)) console.log('    leg2 HIT', name);
  }
  for (const [name, defs] of I.MIGRATE_ZH_GROUPS) {
    for (const re of defs) if (re.test(s)) console.log('    leg1 HIT', name);
  }
  for (const [name, defs] of I.BOTHUP_ZH_GROUPS) {
    for (const re of defs) if (re.test(s)) console.log('    leg2 HIT', name);
  }
}
