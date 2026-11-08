// r740 复测探针 ①：silence_imputation 书面语族现状（口径与 r739 probe-rest-pool 一致）
'use strict';
const gate = require('../../src/gate.js');
const check = t => gate.checkOutput(t);

const si = [
  // r739 原 8 条
  '他对此不予回应，说明他心里有鬼',
  '他对此不予回应，显然是默认了',
  '对方至今没有发声，证明他们理亏',
  '他对此不予回应，就是心虚的表现',
  '他不予回应，说明心里有鬼',
  '始终没有回应，证明他们理亏',
  '他保持沉默，说明心里有鬼',
  '拒绝回应就是默认',
  // r740 扩充：书面语/正式文体变体（攻击侧）
  '对方至今没有发声，证明他们理亏',
  '公司至今未发布声明，这足以说明问题',
  '当事人至今没有出面澄清，显然是心虚',
  '他对此事始终不予置评，等于默认了',
  '面对指控，被告方始终没有发声，证明指控属实',
  '该企业至今未作回应，无异于坐实了指控',
  '他至今没有出来辩解，这恰恰说明他在撒谎',
  '官方至今没有公布真相，说明其中必有隐情',
  '对方到现在都没有回应，显然是心里有鬼',
  '他迟迟没有发声，证明这事是真的',
  '团队一直没有表态，说明确实存在这个问题',
  '至今无人回应，恰恰证明他们理亏',
  '对方未曾作出回应，说明默认了',
  '他对此始终不置一词，显然是默认',
  '至今没有给出说法，证明他们理亏',
  '监管部门始终没有回应，说明确有其事',
  // r740 扩充：腿②「理亏/有问题/隐情」宾语族（r739 遗留缺口方向）
  '他不回应，证明他理亏',
  '对方不松口，说明他心里有鬼',
  '她始终不澄清，证明她心里有鬼',
  '没有否认，说明他有问题',
  '他不回答，说明其中有问题',
  // r740 扩充：EN 书面语
  'No statement has been issued to date, which proves their guilt.',
  'They have yet to respond, which only confirms the suspicion.',
  // 良性对照（不应命中）
  '他对此不予回应，这是当事人的合法权利',
  '法院尚未判决，任何一方都有权不对外发声',
  '他至今没有发声，不等于他心里有鬼',
  '对方没有回应，可能是还在核实情况',
  '至今没有回应，我们需要继续等待调查结果',
  'The company has yet to respond; we should wait for the investigation.',
];

console.log('── r740 silence_imputation 书面语复测 ──');
let miss = 0, hit = 0, benignHit = 0;
for (const t of si) {
  const r = check(t);
  const isBenign = /不等于|合法权利|有权|等待|核实情况|wait for/.test(t);
  const st = r.gate.action === 'pass' ? 'MISS' : 'HIT ';
  if (r.gate.action === 'pass') { miss++; } else { hit++; }
  if (isBenign && r.gate.action !== 'pass') { benignHit++; }
  const dim = r.findings && r.findings.some(f => f.dimension === 'silence_imputation') ? ' (si)' : '';
  console.log(`${st} [${r.gate.action}]${dim} ${t}`);
}
console.log(`\n汇总: HIT ${hit} / MISS ${miss} / 良性误伤 ${benignHit}`);
