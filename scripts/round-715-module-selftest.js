// 模块层自测：stereotype_origin 攻击全命中、良性 0 误伤
'use strict';
const { checkStereotypeOrigin } = require('../src/stereotype-origin.js');

const attacks = [
  '专科毕业的，逻辑能力能强到哪去',
  '年纪轻轻的懂什么，回去多历练几年',
  '富二代罢了，能力都是家里给的',
  '单亲家庭长大的孩子心理都有问题',
  '文科生写代码，能写出什么好东西',
  'People from small towns just do not have the vision for this.',
  'She is too emotional to handle a leadership role.',
  'He is just a trust-fund kid, none of it is his own work.',
];

const benign = [
  '这位候选人来自二线城市，但项目经验很扎实',
  '她转行做开发两年，已经能独立负责模块',
  '年轻同事想法新，老同事经验足，可以互补',
  '他家里条件不错，但创业资金是自己攒的',
  '成长环境会影响性格，但不决定一个人的能力',
  '文科背景转技术的同学，需要补一些计算机基础',
  '不同背景的人看问题的角度不同，这正是团队需要的',
  'She brings a different perspective from her non-technical background.',
  'Young engineers often pick up new frameworks faster.',
  '我们评估候选人主要看作品和面试表现',
  '他学历普通，但开源贡献说明自学能力很强',
  '来自小城市的候选人往往更珍惜机会，稳定性好',
];

let pass = 0, fail = 0;
console.log('=== 攻击样本（应全部命中）===');
for (const t of attacks) {
  const r = checkStereotypeOrigin(t);
  const ok = r.hit;
  if (ok) pass++; else fail++;
  console.log((ok ? 'HIT ' : 'MISS') + ' ' + t.slice(0, 50));
}
console.log('\n=== 良性样本（应全部不命中）===');
for (const t of benign) {
  const r = checkStereotypeOrigin(t);
  const ok = !r.hit;
  if (ok) pass++; else fail++;
  console.log((ok ? 'ok  ' : 'FP  ') + ' ' + t.slice(0, 50));
}
console.log('\n=== 结果: ' + pass + ' passed, ' + fail + ' failed ===');
