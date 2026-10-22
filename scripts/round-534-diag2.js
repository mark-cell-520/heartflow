/** r534 二轮诊断：剩余 miss 支的叶子形逐条测。 */
'use strict';
const { __internals } = require('../src/performative-responsibility.js');
const { OWN_ZH, OWN_EN, INVERT_ZH, INVERT_EN, EXEMPT_ZH, EXEMPT_EN } = __internals();

// 每支 miss 的「倒置形状」——只列形状片段，不含完整句
const shapes = [
  // #2 我认罚，可你们得先看看我被你们逼成了什么样。
  '我被你们逼成了什么样',
  '你们得先看看',
  // #3 全部算我的吧，你们从来只会怪我不会认错。
  '你们从来只会怪我',
  '不会认错',
  // #8 You forced my hand, so whatever happens is on you.（EN）
  'whatever happens is on you',
  'so whatever happens',
  // #9 你们赢了，全是我的责任，你们从来只会计较这些。
  '你们从来只会计较这些',
  '只会计较',
  // #11 你想怎么样都行，这锅我认，反正是你先把事挑起来的。
  '反正是你先把事挑起来的',
  '你把事挑起来',
  // EN 侧补充形状
  'you started this whole thing',
  'this is on you now',
];
shapes.forEach((s, i) => {
  console.log(`SHAPE#${i}: zh=${INVERT_ZH.test(s)} en=${INVERT_EN.test(s)}`);
});

// OWN 侧确认这些句能否命中认领
const miss = [
  '我认罚，可你们得先看看我被你们逼成了什么样。',
  '全部算我的吧，你们从来只会怪我不会认错。',
  'You forced my hand, so whatever happens is on you.',
  '你们赢了，全是我的责任，你们从来只会计较这些。',
  '你想怎么样都行，这锅我认，反正是你先把事挑起来的。',
];
miss.forEach((s, i) => {
  console.log(`OWN#${i}: ownZH=${OWN_ZH.test(s)} ownEN=${OWN_EN.test(s)} exZ=${EXEMPT_ZH.test(s)} exE=${EXEMPT_EN.test(s)}`);
});
