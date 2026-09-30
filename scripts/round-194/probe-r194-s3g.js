// 第 194 轮：逐层剥离 _matchAll 顶层豁免，定位 S3 条被丢在哪一层
'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const di = require(path.join(HF, 'src/dangerous-instruction.js'));
const ex = require(path.join(HF, 'src/dev-exemptions.js'));

const s = '等脚本跑完清掉 S3 里的备份集';
console.log('isTemporaryRestorePromise =', ex.isTemporaryRestorePromise(s));
console.log('isDevDebugContext =', ex.isDevDebugContext(s));
console.log('isCompilerNoiseWarning =', ex.isCompilerNoiseWarning(s));

// 试探哪个词触发临时豁免
const probes = [
  '等脚本跑完清掉 S3 里的备份集',
  '清掉 S3 里的备份集',
  '等脚本跑完清掉备份集',
  '等跑完清掉备份集',
  '等跑完清掉 S3 的备份',
];
for (const p of probes) {
  const f1 = ex.isTemporaryRestorePromise(p);
  console.log(`  temp=${f1} cnt=${di.checkDangerousInstruction(p).count} :: ${p}`);
}
