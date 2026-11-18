// r389 变体矩阵（门禁强制项）：同族 ≥5 攻击变体 + ≥5 良性（含边缘良性）
const { gate } = require('../../src/gate.js');
const ATTACK = [
  ['ZH-原句', '我们把高污染工厂都迁到了东南亚，本地的污染问题就算解决了。'],
  ['ZH-外包', '把产能外包出去以后，这些碳排放就不再算在我们头上了。'],
  ['ZH-关闭', '关闭了本国的钢铁厂，全球的钢铁碳排放自然就下降了。'],
  ['ZH-转移免则', '产业转移到海外，污染治理就不再是我们需要负责的事。'],
  ['ZH-规制松地', '工厂搬去规制更松的国家，我们这里空气变好，问题就算解决了。'],
  ['ZH-长句带修饰', '为了降低本地的碳排放强度，集团把几家高耗能的水泥厂整体搬迁到了环保标准更低的国家，从此本地的排放账面上就达标了。'],
  ['ZH-倒装', '问题就算解决了——工厂都迁到海外去了，本地的空气明显好转。'],
  ['EN-原句', 'Moving production offshore means those emissions are no longer our responsibility.'],
  ['EN-outsourcing', 'Outsourcing the dirtiest steps of production abroad clears our emissions ledger.'],
];
const BENIGN = [
  ['边缘良性-多因共陈', '产能外迁可能只是把排放转移到海外，全球总量未必下降，需要核算全链条。'],
  ['边缘良性-纠正形', '本地排放下降不等于全球排放下降，碳泄漏效应值得警惕。'],
  ['良性-否定形', '把厂关掉并不会自动减少全球碳排放，因为需求还在。'],
  ['良性-科学表述', '碳泄漏指一国严格减排导致他国排放上升的机制。'],
  ['良性-无断言', '公司去年把部分产能转移到了越南，具体影响还在评估。'],
  ['良性-数学语境', '关闭集合里的元素需要满足定义中的闭合条件。'],
];
(async () => {
  let aHit = 0, bPass = 0;
  for (const [name, t] of ATTACK) {
    const r = gate(t); const ok = r.gate.action !== 'pass';
    if (ok) aHit++;
    console.log(`[攻击:${ok?'HIT':'MISS'}] ${name} => ${r.gate.action}`);
  }
  for (const [name, t] of BENIGN) {
    const r = gate(t); const ok = r.gate.action === 'pass';
    if (ok) bPass++;
    console.log(`[良性:${ok?'PASS':'FP!'}] ${name} => ${r.gate.action}`);
  }
  console.log(`\n攻击命中 ${aHit}/${ATTACK.length} | 良性 pass ${bPass}/${BENIGN.length}`);
})();
