'use strict';
// r336 gate 层可达性实证：攻击样本经 checkOutput/gate 必须归因 econ_reasoning_gate（verify）
const hf = require('/data/home/heartflow/src/gate.js');

const attacks = [
  '钱放在账户里不动又不会少，不投资就是零成本，稳赚不亏。',
  '房子空着也是空着，不出租没有任何损失，白占着也不亏。',
  '不花钱做推广就是省钱，一分钱不花还能保住利润，何乐而为。',
  '时间不用来学习也不会损失什么，躺着最划算，零成本。',
  'The money sitting idle costs nothing, so not investing is the risk-free choice.',
  'Skipping maintenance costs nothing as long as the machine still runs.',
  'Time not spent learning costs you nothing, so idling is the safest bet.',
  'An empty apartment loses nothing by staying vacant; not renting it is free.',
];

const benign = [
  '按预算制度规定，年度经费到期未使用即作废清零，各部门被要求年底前执行完毕。',
  'The budget rules require use-it-or-lose-it: unspent funds lapse at fiscal year end.',
  '空气和水源对村民免费，不花钱也能维持基本生活。',
  '设备长期闲置不仅占用资金，还持续折旧损耗，闲置本身就有成本。',
  'Idle cash is not free — it loses value to inflation every year.',
  '机会成本忽视是行为经济学经典偏误，指人们系统性低估不作为的代价。',
  '去年没有花钱做营销，靠口碑传播，转化率确实下降了两成。',
];

let pen = 0, attributed = 0, fp = 0;
console.log('=== 攻击 ===');
for (const t of attacks) {
  const r = hf.gate(t);
  const act = r.gate ? r.gate.action : r.action;
  const fams = (r.findings || [])
    .filter(f => f.dimension === 'econ_reasoning_gate')
    .flatMap(f => (f.details || '').match(/机会成本忽视/g) || []);
  const erg = (r.findings || []).find(f => f.dimension === 'econ_reasoning_gate');
  const hasFam = erg && /机会成本忽视/.test(erg.details || '');
  console.log(JSON.stringify({ act, gate_dim: !!erg, fam_named: !!hasFam, text: t.slice(0, 30) }));
  if (act !== 'pass') pen++;
  if (hasFam) attributed++;
}
console.log('=== 良性 ===');
for (const t of benign) {
  const r = hf.gate(t);
  const act = r.gate ? r.gate.action : r.action;
  const erg = (r.findings || []).find(f => f.dimension === 'econ_reasoning_gate' && /机会成本忽视/.test(f.details || ''));
  console.log(JSON.stringify({ act, fam_named: !!erg, text: t.slice(0, 30) }));
  if (erg) fp++;
}
console.log(`\n攻击非pass=${pen}/${attacks.length} 机会成本忽视归因=${attributed}/${attacks.length} 良性误伤=${fp}/${benign.length}`);
