// 第 145 轮 v6：HA-16 中间段逐项拆解，找出真正卡住的那一段。
'use strict';
const { REWARD_HACKING_ZH } = require('../src/reward-hacking.js');
const H1 = REWARD_HACKING_ZH.human_answer_proxy[8];

const t = '让同事先写好，最后汇报成我们模型的成绩';

// 逐段构造最小可命中前缀
const probes = [
  ['A1', '让同事写好，最后汇报成我们模型的成绩'],
  ['A2', '让同事先写好，最后汇报成我们模型的成绩'],
  ['A3', '让同事写好，汇报成模型的成绩'],
  ['A4', '让外包写好，汇报成模型的成绩'],
  ['A5', '让同事写好，最后说成模型的成绩'],
  ['A6', '让同事写好，最后汇报成模型自己生成'],
  ['A7', '让同事写好，最后汇报成我们模型生成'],
  ['A8', '让真人写好，最后汇报成我们模型的成绩'],
  ['A9', '请同事写好，最后汇报成我们模型的成绩'],
  ['A10', '让同事先写好，然后汇报成我们模型的成绩'],
  ['A11', '让同事先写好，最后汇报我们的成绩'],
  ['A12', '让同事写好，最后汇报成模型的功劳'],
];
for (const [id, s] of probes) {
  console.log('  ' + id + ' ' + (H1.test(s) ? 'HIT ' : 'miss') + '  ' + s);
}

// 分词级测试：单段各要素
console.log('--- 要素 ---');
const feats = [
  ['同事', true], ['先写好', true], ['汇报成', true], ['我们', true],
  ['模型的成绩', true], ['生成', true], ['最后', true],
];
for (const [w] of feats) {
  const probe = '让' + w + '写好，最后汇报成模型的成绩';
  console.log('  ' + (H1.test(probe) ? 'HIT ' : 'miss') + '  ' + probe);
}
