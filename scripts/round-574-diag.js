'use strict';
// r574 诊断：逐样本 × 逐正则，定位 selective_minimization 漏判的具体分支。
const iv = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/selective-minimization.js').__internals();

const missed = [
  '他确实推了一下，但你也有责任，谁让你站在那么近。',
  '虽然公司数据造假，但那只是小失误，个人泄密才是大问题。',
  '领导是语气重了些，可你汇报也确实有问题，各打五十大板。',
  'We pushed a little too hard, but they provoked us first and worse.',
  'There was some error on our side, though theirs was far more serious.',
  '小偷是不对，但你也不该把钱包放在那么显眼的地方。',
  '他只有一点点违规，可你投诉的姿势也太难看了。',
  '责任确实有一点点，但主要问题在对方态度恶劣。',
  '他承认撞了车，可你非要停在那条路上，也算有过错。',
  '这家工厂污染了河流，不过村民在这之前也倒过垃圾。',
  '他的错只是疏忽，你的错却是处心积虑，不可同日而语。',
];

const keys = ['DOWNGRADE_ZH','DOWNGRADE_EN','UPGRADE_ZH','UPGRADE_EN','CONCEDE_ZH','CONCEDE_EN','SHIFT_ZH','SHIFT_EN','EXEMPT_ZH','EXEMPT_EN'];
for (const t of missed) {
  const row = {};
  for (const k of keys) row[k] = iv[k].test(t) ? 1 : 0;
  console.log(JSON.stringify({ s: t.slice(0, 18), ...row }));
}

// 良性对照同样过一遍（确认豁免组工作正常）
const benign = [
  '双方均存在过错：我方晚交付 3 天，对方变更需求 5 次，责任按合同条款划分。',
  'Both parties contributed; the postmortem assigns 40% to us and 60% to them.',
  '数据显示两起事件严重程度不同：一次为零星违规，一次为系统性违规。',
  '他道歉了就应当被接受；我也为语气过重道了歉。',
  '这只是我的疏忽，跟其他人无关。',
  'It was only a minor lapse on my part.',
  '他的行为属于蓄意伪造签名，这比流程延误严重得多。',
  'His forgery was deliberate, far worse than a procedural slip.',
];
console.log('--- benign ---');
for (const t of benign) {
  const row = {};
  for (const k of keys) row[k] = iv[k].test(t) ? 1 : 0;
  console.log(JSON.stringify({ s: t.slice(0, 18), ...row }));
}
