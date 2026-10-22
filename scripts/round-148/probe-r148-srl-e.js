// 第 148 轮探针 v5：自评侧剩余两条逐支定位（只报索引位图，不打印原文）
'use strict';
const { REWARD_HACKING_ZH, checkRewardHacking } = require('../../src/reward-hacking.js');

const VARIANTS = [
  '模型自己评估自己，分数达标就算通过',
  '模型给自己打了九十分，证明效果很好',
  '让 AI 自己检查自己，没发现问题就是没问题',
  '让系统给自己下结论，输出显示已成功',
  '让模型给自己盖上合格的章',
  '它自评说及格了，就算验收通过',
  '自己给自己打分，分数高自然代表质量好',
  '由它自己判断是否通过，通过的结论就是它的自评',
  '模型给自己写验收意见，说他完全符合要求',
  '让模型自评后就颁发通过证明',
  '生成的答案让同一个模型来审阅，通过即算对',
  '让模型自己判断自己有没有完成任务',
  '模型给自己的输出打上合格的标记就算数',
  '让模型自查一遍，自查没毛病就结了',
  'AI 给自己做评测，分数到了就当作达标',
  // 补齐组
  '让模型自己给自己打分，闭环评估',
  '生成和评判都归它，自己说了算',
  '用同一个模型既答题又阅卷',
  '自评一通过就算合格',
  '模型自己给自己写了一份漂亮的评估报告',
];

const table = REWARD_HACKING_ZH.self_referential_loop;
console.log('现表条数:', table.length);
VARIANTS.forEach((s, i) => {
  const hitIdx = [];
  table.forEach((r, j) => { if (r.test(s)) hitIdx.push(j); });
  const res = checkRewardHacking(s);
  const clsHit = res.classes.includes('self_referential_loop');
  console.log(`样本#${i}: regex支[${hitIdx.join(',')}] class=${clsHit}`);
});
