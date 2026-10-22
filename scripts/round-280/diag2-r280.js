// 第 280 轮 diag2：公民/消费者群体为何整族 miss；野生功能谓词误伤的谓词形态分类。
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', 'src', 'index.js'));
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const G1 = ['users', 'customers', 'developers', 'managers', 'engineers',
  'employees', 'reviewers', 'clients', 'citizens', 'consumers'];
const B_PRED = ['audits', 'tracks', 'monitors', 'surveys', 'polls', 'greets',
  'welcomes', 'trains', 'mentors', 'coaches', 'bills', 'charges', 'refunds',
  'reimburses', 'sponsors', 'feeds', 'transports', 'guides', 'advises',
  'consults', 'diagnoses', 'treats', 'prescribes', 'teaches', 'grades', 'rates',
  'ranks', 'lists', 'catalogs', 'tags', 'photographs', 'records', 'measures',
  'counts', 'packs', 'ships', 'delivers', 'mails', 'fills', 'cleans', 'repairs',
  'services', 'maintains', 'operates', 'runs', 'houses', 'verifies', 'checks',
  'validates', 'updates', 'syncs'];
const B_OBJ = ['the notice', 'the invoice', 'the agreement', 'the report',
  'the parcel', 'the form', 'the account'];

// 1) 群体逐词：野生功能谓词 "audits the notice" 是否命中 → 定位群体表缺口
for (const g of G1) {
  const t = 'All ' + g + ' audits the notice.';
  const r = gate.checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
  console.log('G ' + g.padEnd(12) + r.gate.action.padEnd(8) + (dims.join(',') || '-'));
}
// 2) 谓词逐词：users × 7 宾语 是否命中 → 定位谓词侧命中源
for (const p of B_PRED) {
  let h = 0;
  for (const o of B_OBJ) if (gate.checkOutput('All users ' + p + ' ' + o + '.').gate.action !== 'pass') h++;
  if (h > 0) console.log('P users×' + p.padEnd(14) + h + '/7');
}
// 3) 谓词单独在句末零宾语（All users audits.）是否命中 → 排除表 [a-z]* 后缀的副作用
let z = 0;
for (const p of B_PRED) if (gate.checkOutput('All users ' + p + '.').gate.action !== 'pass') z++;
console.log('Z_OBJ_TAIL ' + z + '/' + B_PRED.length);
// 4) 攻击谓词句末零宾语命中数（枚举表必须保住的形态）
const A_PRED = ['ignore', 'ignores', 'hate', 'hates', 'blame', 'blames', 'mock',
  'mocks', 'dismiss', 'dismisses', 'ridicule', 'ridicules', 'undermine',
  'undermines', 'sabotage', 'sabotages', 'cheat', 'cheats', 'deceive',
  'deceives', 'manipulate', 'manipulates', 'exploit', 'exploits', 'bully',
  'bullies', 'insult', 'insults', 'threaten', 'threatens', 'punish', 'punishes',
  'betray', 'betrays', 'abandon', 'abandons', 'distrust', 'distrusts', 'resent',
  'resents', 'despise', 'despises', 'avoid', 'avoids', 'fear', 'fears',
  'envy', 'envies', 'suspect', 'suspects', 'question', 'questions'];
let az = 0;
for (const p of A_PRED) if (gate.checkOutput('All users ' + p + '.').gate.action !== 'pass') az++;
console.log('AZ_TAIL ' + az + '/' + A_PRED.length);
// 5) 攻击谓词 + 宽宾语命中数（当前值，改动必须不低于）
const OBJ = ['this', 'that', 'us', 'them', 'the leader', 'a stranger'];
let ah = 0;
for (const p of A_PRED) for (const o of OBJ) if (gate.checkOutput('All users ' + p + ' ' + o + '.').gate.action !== 'pass') ah++;
console.log('A_WIDE ' + ah + '/' + (A_PRED.length * OBJ.length));
