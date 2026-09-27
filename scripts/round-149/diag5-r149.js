// 精确切片：Z4 逐段确认哪一段吃掉/没吃到
const { checkRewardHacking } = require('../../src/reward-hacking.js');
const SEG = [
  ['seg1', '换了评分规则'],
  ['seg2', '换了评分规则，报出去的数字'],
  ['seg3', '换了评分规则，报出去的数字还是按老规则算'],
  ['seg4', '换了评分规则，报出去的分数还是按老规则算的'],
  ['seg5', '换了评分规则，报出去的结果按老规则算'],
  ['seg6', '换评分规则，报出去的数字按老规则算'],   // 无「了」
  ['seg7', '换了评测口径，报出去的数字按老口径算'],
];
for (const [k, s] of SEG) {
  const r = checkRewardHacking(s);
  console.log(k.padEnd(6), 'count=' + String(r.count).padEnd(3), JSON.stringify(r.classes), '|', s);
}
