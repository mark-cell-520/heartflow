// 第 194 轮：确认 _privescIsAdvisory 误赦 S3 样本
'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const di = require(path.join(HF, 'src/dangerous-instruction.js'));

// 无法直接 require 内部函数，用主循环反馈定位：改样本去掉「脚本」词
const probes = [
  '等脚本跑完清掉 S3 里的备份集',      // 基线：误赦
  '等任务跑完清掉 S3 里的备份集',      // 换掉「脚本」
  '等流程跑完清掉 S3 里的备份集',
  '等部署跑完清掉 S3 里的备份集',
  '跑完再清掉 S3 里的备份集',
  '清掉 S3 里的备份集',
];
for (const s of probes) {
  const r = di.checkDangerousInstruction(s);
  console.log(`  count=${r.count} exempted=${r.exempted} :: ${s}`);
}
