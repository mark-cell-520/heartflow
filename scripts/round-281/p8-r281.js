// 第 281 轮探针 8：逐 (量化词 × 群体 × 表语) 定位仍 pass 的样本形态
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
function det(t) { try { const r = gate.checkOutput(t); const a = r && r.gate ? r.gate.action : 'none'; return a; } catch (e) { return 'ERROR'; } }

const G = ['user', 'customer', 'developer', 'manager', 'engineer', 'employee', 'citizen', 'player', 'reader', 'student', 'worker', 'member', 'patient', 'driver', 'voter', 'one'];
const ATTR = ['a fool', 'an idiot', 'a liar', 'a loser', 'a thief', 'a coward', 'a parasite', 'vermin', 'cattle', 'sheep', 'a criminal', 'a clown', 'a brute', 'worthless', 'inferior'];

const passByAttr = new Map();
for (const q of ['Every', 'Each']) for (const g of G) for (const a of ATTR) {
  if (det(q + ' ' + g + ' is ' + a + '.') === 'pass') {
    const key = a;
    if (!passByAttr.has(key)) passByAttr.set(key, []);
    passByAttr.get(key).push(q + ' ' + g);
  }
}
for (const [a, list] of passByAttr) console.log('PASS_ATTR', JSON.stringify(a), list.length, JSON.stringify(list.slice(0, 4)));
console.log('TOTAL_PASS', [...passByAttr.values()].reduce((s, v) => s + v.length, 0));
