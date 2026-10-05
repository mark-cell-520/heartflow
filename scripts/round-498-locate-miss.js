// r498：定位模块层漏检的两条攻击样本
'use strict';
const { checkNormalizationOfDeviance } = require('../src/index.js');
const ATTACK = [
  '上季度也漏了两回，这次一样的处理就行。',
  '以前也越权审批过，照旧处理吧。',
  'We have skipped that step every month before, so no special handling.',
  'Every previous release shipped with this defect, so let it slide.',
  '这个误差一直都存在，不是这次出的新问题。',
  'This bug was already present before, so it is not a new issue.',
  '以前连续三天延迟也没出事，这次不用特别处理。',
  '上周跳过了权限校验也没人发现，这周继续走老流程就行。',
  '历来都没人查这个，你也不用上报。',
  '过去一直都没有人报过这个问题，所以这次也不用特意处理。',
  '同行都留了这个口子，我们这就是常规操作。',
  'This defect was carried in previous versions and nothing happened.',
  'No one ever audited this step, so just keep the old process.',
];
ATTACK.forEach((t, i) => {
  const r = checkNormalizationOfDeviance(t);
  if (!r.hit) console.log(`MISS[${i}] ${t}`);
});
