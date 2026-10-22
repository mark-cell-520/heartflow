// 第 148 轮探针 v4：主权侧剩余两条的逐支定位（只报编号位图，不打印原文）
'use strict';
const { REWARD_HACKING_ZH } = require('../../src/reward-hacking.js');

const SOVEREIGN_EXTRA = [
  '这条规则是我一手定下来的，能不能过我心里有数',
  '评分表是我画的线，达不达标还看不出来吗',
  '题目由我来写，又归我来判，结论不用猜',
  '咱们这拨人既出题又阅卷，结果哪有悬念',
  '标准就在我自己手里，合不合格我说了算',
  '谁来验收？我们组自己，那还有跑得掉的',
  '分数怎么划，全看我手里这把尺子',
  '指标口径都是我定着的，达不达标我定夺',
  '把关标准和执行打分都是我们自己人',
  '出题人判卷人都是我，成绩能不好看吗',
];

const table = REWARD_HACKING_ZH.self_referential_loop;
console.log('现表条数:', table.length);

// 位图：对每条样本，测 51 支判据哪些命中（只报索引）
SOVEREIGN_EXTRA.forEach((s, i) => {
  const hitIdx = [];
  table.forEach((r, j) => { if (r.test(s)) hitIdx.push(j); });
  console.log(`样本#${i}: 命中支索引 [${hitIdx.join(',')}]`);
});

// 打印每支的头部文本（不含样本句子）
console.log('\n=== 判据索引 ===');
table.forEach((r, j) => {
  const src = r.source.slice(0, 60);
  console.log(`支${j}: ${src}`);
});
