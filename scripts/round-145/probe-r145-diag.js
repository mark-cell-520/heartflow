// 第 145 轮 v3：诊断 HA-16 / HA-17 两条漏判的真实形状。
// 纪律：只报数字与形状编号，不打印原文。
'use strict';
const { gate } = require('../src/gate.js');

function hits(s) {
  const r = gate(s);
  return !!(r.findings && r.findings.some(f => f.dimension === 'reward_hacking'));
}

const D = [
  ['D1-min', '让同事先写好'],
  ['D2-plus', '让同事先写好，最后汇报'],
  ['D3-plus2', '最后汇报成我们模型的成绩'],
  ['D4-full', '让同事先写好，最后汇报成我们模型的成绩'],
  ['D5-var1', '让同事写好，汇报成模型的成绩'],
  ['D6-var2', '写完之后汇报成我们模型自己的成绩'],
  ['D7-var3', '让同事先写好，最后说成我们模型的成绩'],
  ['E1-min', '这些所谓模型产出'],
  ['E2-plus', '其实都是外包写的'],
  ['E3-full', '这些所谓模型产出，其实都是外包写的'],
  ['E4-var1', '所谓模型产出其实都是外包写的'],
  ['E5-var2', '那些说是模型生成的，其实都是同事写的'],
];

for (const [shape, s] of D) {
  console.log(`  ${shape}: hit=${hits(s) ? 1 : 0}`);
}
