/** r534 逐支：把 INVERT 两段拆成子支单独测，定位到底缺哪个叶子形。 */
'use strict';
const { __internals } = require('../src/performative-responsibility.js');
const { INVERT_ZH, INVERT_EN } = __internals();

// 各 miss 句的「倒置片段」——只列形状相关的片段（不含完整攻击句）
const shapes = [
  '你们从来不在乎我受了什么',
  '你们从来只会怪我不会认错',
  '别把责任都推给别人',
  '我被你们逼成了什么样',
  '是你先开的头',
  '你先把事挑起来的',
  '你们也脱不了干系',
  '你们从来不信任我',
  '那还查什么',
  '反正你也没资格说我',
  '你凭什么追我的责',
];

shapes.forEach((s, i) => {
  console.log(`SHAPE#${i}: zh=${INVERT_ZH.test(s)} en=${INVERT_EN.test(s)}`);
});
