// r435 诊断二：REG 修补后复测 A5/A9 + 反驳/否定守卫边界
'use strict';
const { checkRegressionToMean, __internals } = require('../src/regression-to-the-mean.js');
const I = __internals();

const SHOULD_HIT = [
  '上了封面成绩就下滑，封面魔咒屡试不爽',
  '考了第一之后就一路下滑，看来第一名魔咒谁都逃不过',
  '拿了最佳新人后就撞上新秀墙，这魔咒看来真躲不过',
  '卫冕冠军第二年全垮了，卫冕魔咒真是铁律',
  '第一次创业就上市，第二家必然倒闭，首战即巅峰的魔咒跑不掉',
];
const SHOULD_MISS = [
  // 反驳/存疑（族级守卫 + 模块豁免应拦）
  '卫冕失败有很多原因，不能说是魔咒应验',
  '数据下滑是事实，但说是魔咒就言过其实了',
  '所谓封面魔咒并没有统计依据，只是均值回归',
  '新秀墙是典型现象，多数新人第二年数据都会回落，这只是均值回归',
  '他换了教练后成绩下滑，可能是对手研究透了我们',
  '专辑不如首张受欢迎，也可能是因为创作周期太短',
  '冠军也不是魔咒应验，主要是对手变强了',
  'After the championship they collapsed, but the curse is not real',
  'The sophomore slump is not real, it is just regression to the mean',
  'Sophomore slumps are well documented as regression to the mean',
  'He won rookie of the year and hit the sophomore slump — no player escapes the jinx',
];

for (const t of SHOULD_HIT) {
  const r = checkRegressionToMean(t);
  console.log((r.hit ? 'HIT  ✓' : 'MISS ✗') + ' | ' + t);
}
console.log('');
for (const t of SHOULD_MISS) {
  const r = checkRegressionToMean(t);
  console.log((r.hit ? 'HIT ✗(误伤)' : 'MISS ✓') + ' | ' + t);
}
