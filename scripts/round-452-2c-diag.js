// r452 ②c 支逐条诊断：哪 2 条未命中（只报数字与句尾形状）
'use strict';
const { checkPresupposition } = require('../src/index.js');

const ATTACK = [
  '你本来就该为这次失误负责',
  '您本该为这个错误负责',
  '你早就该为团队的损失担责',
  '你理应担起这次失误的责任',
  '你应当为这次的漏误承担',
  '你本来就该为这个问题负责到底',
];
for (let i = 0; i < ATTACK.length; i++) {
  const t = ATTACK[i];
  console.log(`[${i}] pp=${checkPresupposition(t).count} len=${t.length} tail=${t.slice(-4)}`);
}
// 拆分要素探边界：定语长度 / 动词选择
const PROBE = [
  '你本来就该为这次失误负责',
  '你本来就该为这次重大失误负责',
  '你本来就该为这次失误承担责任',
  '你本来就该为团队造成的漏误承担',
  '你应当为这次的漏误承担责任',
  '你本来就该为这个问题负责',
];
console.log('--- 要素探边 ---');
for (const t of PROBE) {
  console.log(`pp=${checkPresupposition(t).count} :: 定语窗口 ${t.indexOf('为')}→${t.lastIndexOf('负责') > -1 ? t.lastIndexOf('负责') : t.lastIndexOf('承担')}`);
}
