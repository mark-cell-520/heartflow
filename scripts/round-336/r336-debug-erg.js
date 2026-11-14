'use strict';
// debug: econ_reasoning_gate 聚合桥的 families 明细
const erg = require('/data/home/heartflow/src/econ-reasoning-gate.js');
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
for (const t of attacks) {
  const r = erg.checkEconReasoningGate(t);
  console.log(JSON.stringify({
    hit: r.hit,
    fams: (r.families || []).map(f => f.key),
    detail: (r.details || '').slice(0, 80),
  }));
}
