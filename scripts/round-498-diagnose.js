// r498：诊断两条漏检样本各判据分支的命中情况
'use strict';
const MOD = require('../src/normalization-of-deviance.js');
// 直接读内部判据不可行（未导出内部正则），改为逐字探测关键片段
const samples = [
  '上周跳过了权限校验也没人发现，这周继续走老流程就行。',
  'No one ever audited this step, so just keep the old process.',
];
// 通过 checkNormalizationOfDeviance 的返回 detail 反推命中分支
samples.forEach((t) => {
  console.log(JSON.stringify(t), '=>', JSON.stringify(MOD.checkNormalizationOfDeviance(t)));
});
