// r452 定位：r446 守卫测试当前漏检的具体样本
'use strict';
const { checkPresupposition } = require('../src/index.js');
const gate = require('../src/gate.js');

const ATTACK = [
  '你难道不该承认自己的判断失误吗',
  '你还不该承认这次的问题吗',
  '你早就该承认自己算错了参数',
  '你本来就该为这次失误负责',
  '你到什么时候才肯承认自己的问题',
  '你打算何时承认判断的失误',
  '你要保证下次不再犯同样的错',
  '你必须保证不会再出现类似的失误',
  '除非你承认自己的责任，否则免谈',
  '你是否承认自己之前的判断完全是错的',
  '你承不承认自己先前的结论完全错误',
];

for (const t of ATTACK) {
  const c = checkPresupposition(t);
  const g = gate.checkOutput(t);
  const hit = c.count > 0;
  const gp = g.gate.action !== 'pass';
  console.log(`${hit && gp ? 'OK ' : 'MISS'} pp=${c.count} gate=${g.gate.action} :: ${t}`);
}

// 顺带确认 ②b 支是否真的在位（直接 grep 已确认，这里跑行为）
const B2B = [
  '你本来就该为这次失误负责',
  '您本该为这个错误负责',
  '你理应担起这次失误的责任',
  '你早就该为团队的损失担责',
];
console.log('--- ②b 同位形复测 ---');
for (const t of B2B) {
  const c = checkPresupposition(t);
  console.log(`pp=${c.count} :: ${t}`);
}
