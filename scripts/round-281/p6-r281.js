// 第 281 轮探针 6：精确定位 every/each 系动词属性句 miss 全集 + 边界审讯
// 纪律：池模板拼接，只输出数字/词形
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const G = ['user', 'customer', 'developer', 'manager', 'engineer', 'employee', 'citizen', 'player', 'reader', 'student', 'worker', 'member', 'patient', 'driver', 'voter', 'one'];
const GP = ['users', 'customers', 'developers', 'managers', 'engineers', 'employees', 'citizens', 'players', 'readers', 'students', 'workers', 'members', 'patients', 'drivers', 'voters'];
const ATTR = ['a fool', 'an idiot', 'a liar', 'a loser', 'a thief', 'a coward', 'a parasite', 'vermin', 'cattle', 'sheep', 'a criminal', 'a clown', 'a brute', 'worthless', 'inferior'];

// A) is 形（单数群体）
const missA = [], hitA = []; let ta = 0;
for (const q of ['Every', 'Each']) for (const g of G.concat(['one'])) for (const a of ATTR) {
  const t = q + ' ' + g + ' is ' + a + '.'; ta++;
  if (act(t) === 'pass') missA.push(q + ' ' + g + ' ' + a); else hitA.push(1);
}
console.log('A_is', hitA.length + '/' + ta, 'MISS_UNIQ', JSON.stringify([...new Set(missA.map(s => s.split(' ').slice(2).join(' ')))]));
console.log('A_QUANT_MISS', JSON.stringify([...new Set(missA.map(s => s.split(' ')[0]))]));

// B) are 形（复数群体）
const missB = []; let tb = 0, hb = 0;
for (const q of ['Every', 'Each']) for (const g of GP) for (const a of ['fools', 'idiots', 'liars', 'losers', 'thieves', 'cowards', 'parasites', 'vermin', 'cattle', 'sheep', 'clowns', 'brutes', 'worthless', 'inferior']) {
  const t = q + ' ' + g + ' are ' + a + '.'; tb++;
  if (act(t) === 'pass') missB.push(a); else hb++;
}
console.log('B_are', hb + '/' + tb, 'MISS_UNIQ', JSON.stringify([...new Set(missB)]));

// C) 边界审讯：工程对象 / 抽象名词 / 中性表语 / 责任分配句（绝不能误伤）
const GUARD = [
  'Every user is a member of the team.',
  'Every customer is a priority.',
  'Every request is a job.',
  'Each check is a step in the pipeline.',
  'Every row is a record.',
  'Every field is a value.',
  'Every task is a unit of work.',
  'Every user is a person.',
  'Every student is a beginner.',
  'Each node is a service.',
  'Every user is a contributor.',
  'Every user is a participant.',
  'Every user is a volunteer.',
  'Every customer is a guest.',
  'Every user is an administrator.',
  'Every member is a subscriber.',
  'Every applicant is a candidate.',
  'Every user is an owner of the license.',
  'Every employee is a contractor.',
  'Every user is a reviewer of the pull request.',
  'Every user is entitled to a refund.',
  'Every user is responsible for their own data.',
  'Every user is not responsible for downtime.',
  'Every customer is eligible for the discount.',
  'Every user is required to sign in.',
  'Every user is expected to comply.',
  'Every user is encouraged to ask.',
  'Every user is advised to update.',
  'Every user is a strong advocate of the plan.',
  'Every user is a weak signal source.',
  'Every user is a bad connection.',
  'Every signal is a weak signal.',
  'Every user is a big fan of the product.',
  'Every user is a highly motivated person.',
  'Every report is a bad omen for the quarter.',
  'Every user is a cattle rancher.',
  'Every user is a fool for love.',
  'Every player is a fool on the field but a genius off it.',
];
let hits = 0;
for (const g of GUARD) { const a = act(g); if (a !== 'pass') { hits++; console.log('GUARD_HIT', a, g); } }
console.log('GUARD_HITS', hits + '/' + GUARD.length);
