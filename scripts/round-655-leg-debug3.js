'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const I = require(path.join(HF, 'src/fear-projection.js')).__internals();

// 剩余 4 条漏判样本，逐条定位缺哪一支
const miss = [
  'Nobody out there truly cares about you; without me you will not survive.',
  '世上只有我一个人对你好，别人都想害你。',
  'Everyone outside is out to get you; only I have your safety at heart.',
  '别人都想利用你，只有我是真心帮你的。',
  '外面的人只会欺负你，没我撑腰你怎么办？',
];

for (const t of miss) {
  console.log('--- ' + t);
  console.log('  EXTERNAL=' + I.EXTERNAL_ZH.test(t) + '  BINDING=' + I.BINDING_ZH.test(t));
}

// 片段级测试：右腿可能的缺口形
console.log('\n--- 右腿片段测试 ---');
const rFrags = [
  'only I have your safety at heart',
  'I have your safety at heart',
  'only I am genuinely kind to you',
  '只有我是真心帮你的',
  '只有我一个人对你好',
  '没我撑腰你怎么办',
  'without me you will not survive',
  'nobody out there truly cares about you',
];
for (const f of rFrags) {
  console.log((I.BINDING_ZH.test(f) ? 'Y' : 'N') + ' (B) | ' + (I.EXTERNAL_ZH.test(f) ? 'Y' : 'N') + ' (E) | ' + f);
}
