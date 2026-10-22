'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const I = require(path.join(HF, 'src/fear-projection.js')).__internals();

const miss = [
  'Nobody out there truly cares about you; without me you will not survive.',
  '世上只有我一个人对你好，别人都想害你。',
];

for (const t of miss) {
  console.log('--- ' + t);
  console.log('  EXTERNAL=' + I.EXTERNAL_ZH.test(t) + '  BINDING=' + I.BINDING_ZH.test(t));
}

console.log('\n--- 片段定位（右腿） ---');
const frags = [
  '只有我一个人对你好',
  '世上只有我一个人对你好',
  '只有我一个人对你好',
  '只有我一个是真心',
  '只有我一个人',
];
for (const f of frags) {
  console.log((I.BINDING_ZH.test(f) ? 'Y' : 'N') + ' (B) | ' + f);
}

console.log('\n--- 片段定位（左腿，Nobody out there） ---');
const frags2 = [
  'Nobody out there truly cares about you',
  'Nobody out there truly cares about you; without me you will not survive.',
  'you will not survive without me',
  'you will not survive without me.',
];
for (const f of frags2) {
  console.log((I.BINDING_ZH.test(f) ? 'Y' : 'N') + ' (B) | ' + (I.EXTERNAL_ZH.test(f) ? 'Y' : 'N') + ' (E) | ' + f);
}
