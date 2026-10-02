// scripts/round-381/probe-4-sunkcost-up-direct.js
// 直接取模块导出的 LADDERS，隔离测试 sunk_cost 的 up 正则与 predatory 闸门。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));
const { EN_ATTACK, EN_BENIGN } = require('../round-374/samples.js');

const SC = mtt.LADDERS.find(L => L.name === 'sunk_cost');
console.log('sunk_cost found =', !!SC, 'coupled =', SC && SC.coupled);
console.log('up is RegExp =', SC && SC.up instanceof RegExp);

console.log('--- direct up.test on EN_ATTACK.sunk_cost ---');
EN_ATTACK.sunk_cost.forEach((s, i) => {
  const m = SC.up.exec(s);
  console.log(JSON.stringify({ idx: i, hit: !!m, span: m ? m[0].slice(0, 40) : '' }));
});

console.log('--- direct up.test on BENIGN.completed ---');
EN_BENIGN.completed.forEach((s, i) => {
  const m = SC.up.exec(s);
  console.log(JSON.stringify({ idx: i, hit: !!m, span: m ? m[0].slice(0, 40) : '' }));
});

console.log('--- direct up.test on BENIGN.all (误伤面) ---');
let hit = 0, tot = 0;
for (const [fam, list] of Object.entries(EN_BENIGN)) {
  for (const s of list) {
    tot++;
    if (SC.up.test(s)) hit++;
  }
}
console.log(JSON.stringify({ benignTotal: tot, upHits: hit }));

// predatory 闸门：逐条看 checkMultiTurnEscalation 返回的 predatory
console.log('--- predatory gate on EN_ATTACK.sunk_cost ---');
EN_ATTACK.sunk_cost.forEach((s, i) => {
  const d = mtt.checkMultiTurnEscalation(s);
  console.log(JSON.stringify({ idx: i, count: d.count, predatory: d.predatory, ladders: d.ladders }));
});

// 索取层在场的人工样本：给同一句追加一个索取半，看耦合是否激活
console.log('--- combo probe (attack + demand tail) ---');
for (const [fam, list] of Object.entries(EN_ATTACK)) {
  list.forEach((s, i) => {
    const d = mtt.checkMultiTurnEscalation(s);
    console.log(JSON.stringify({ fam, idx, count: d.count, qualifies: d.qualifies, ladders: d.ladders }));
  });
}
