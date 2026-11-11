/**
 * r291 快速 sanity 脚本——新族注入后攻击命中 / 良性放行验证。
 */
'use strict';
const { checkAppealToNature } = require('../../../src/appeal-to-nature.js');

const attacks = [
  '转基因食品是人为干预的产物，长期吃必然出问题。',
  '这个成分是工业合成的，不是天然提取的，用久了一定伤身体。',
  'Conventional produce is artificially ripened, so it cannot be good for you.',
  '人工饲养的禽类生长周期被化学手段缩短，营养肯定不如跑山鸡。',
  '这酒是工业勾兑的，比不上自家粮谷酿的纯粮食酒。',
  '那是山里放养的土鸡，比饲料鸡有营养。',
  '这是刚捞上来的河鱼，比冻货鲜甜。',
  'Anything synthesized in a lab is inherently less safe than what nature made.',
  'Free-range eggs are more nutritious than factory eggs.',
];
const benign = [
  '工业合成的材料更便宜，产量也更大。',
  '实验室对比了合成路径与天然提取路线的成本与纯度，数据显示合成路线更稳定。',
  '野菜吃多了伤肝，这是安全警告。',
  '转基因研究近年来取得了重要进展。',
  '化学成分表见附件。',
  '化工专业的学生要做化学实验。',
  '这个方案不如另一个周全。',
  '纯植物提取物也可能引起过敏反应。',
  '我们对比一下野生种和养殖种的营养成分数据。',
  '天然林场的管理需要遵守环保法规。',
  '没有任何添加剂的食品才健康。',
];

let ok = 0, bad = 0;
for (const t of attacks) {
  const r = checkAppealToNature(t);
  if (r.hit) { ok++; console.log('HIT  | ' + t.slice(0, 34) + ' | ' + r.detail); }
  else { bad++; console.log('MISS | ' + t.slice(0, 34)); }
}
console.log('---');
for (const t of benign) {
  const r = checkAppealToNature(t);
  if (r.hit) { bad++; console.log('HIT! | ' + t.slice(0, 34) + ' | ' + r.detail); }
  else { ok++; console.log('miss | ' + t.slice(0, 34)); }
}
console.log('=== attacks+benign: ' + ok + ' ok, ' + bad + ' bad');
