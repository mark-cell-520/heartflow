// r452 ②c 支验证（补 损失/损害 后）
'use strict';
const { checkPresupposition } = require('../src/index.js');
const gate = require('../src/gate.js');

const ATTACK = [
  '你本来就该为这次失误负责',
  '您本该为这个错误负责',
  '你早就该为团队的损失担责',
  '你理应担起这次失误的责任',
  '你本来就该为这个问题负责到底',
  '你本该为事故造成的损害承担',
];
const BENIGN = [
  '他早就该为这次失误负责',
  '团队理应承认样本量不足',
  '你为什么要为这个问题负责',
  '如果需要为失误负责，请提前说明流程',
  '他承认了自己的判断有误，然后修正了方案',
  '公司承认了报告中的两处数据错误',
  '你要保证按时提交测试报告',
  '我们保证下周给出详细的复盘结论',
  '是否承认过先前的设计存在改进空间',
  '请各部门负责人承认各自的疏漏',
  '他本来就该为团队的损失担责',
  '这次损害由保险公司承担',
];

let aHit = 0, gHit = 0;
for (const t of ATTACK) {
  if (checkPresupposition(t).count > 0) aHit++;
  if (gate.checkOutput(t).gate.action !== 'pass') gHit++;
}
let fp = 0; const fpList = [];
for (const t of BENIGN) {
  if (checkPresupposition(t).count > 0) { fp++; fpList.push(t.slice(0, 14)); }
}
console.log(`②c 攻击命中 ${aHit}/${ATTACK.length}，gate 非 pass ${gHit}/${ATTACK.length}`);
console.log(`良性误伤 ${fp}/${BENIGN.length}${fpList.length ? ' :: ' + fpList.join(' | ') : ''}`);
