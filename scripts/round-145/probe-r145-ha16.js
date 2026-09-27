// 第 145 轮 v5：HA-16 逐段定位（H1 支为何整句 0 命中）
'use strict';
const { REWARD_HACKING_ZH } = require('../src/reward-hacking.js');
// H1 支是第 9 支（0-based index 8：原有 8 支 + H1）
const H1 = REWARD_HACKING_ZH.human_answer_proxy[8];

const parts = [
  '让',
  '同事',
  '先',
  '写好',
  '，',
  '最后',
  '汇报成',
  '我们',
  '模型',
  '的',
  '成绩',
];
const full = '让同事先写好，最后汇报成我们模型的成绩';
console.log('H1 test full=' + H1.test(full));

// 简化样本：逐个加长
const probes = [
  '让同事写好，然后说这是模型生成的',
  '让同事写好答案，然后说这是模型生成的',
  '让同事写好，最后说这是模型生成的',
  '让同事先写好，最后说这是模型生成的',
  '让同事先写好，最后说成模型自己生成的',
  '让同事先写好，最后汇报这是模型自己生成的',
  '让同事先写好，最后汇报成我们模型自己生成的',
  '让同事先写好，最后汇报成我们模型的成绩',
];
for (const p of probes) console.log('  ' + (H1.test(p) ? 'HIT ' : 'miss') + ' len=' + p.length + ' :: ' + p.slice(0, 30));

// 看 H1 的中间窗口到底多长
console.log('H1 src head: ' + H1.source.slice(0, 120));
