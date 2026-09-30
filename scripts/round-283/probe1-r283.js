// 第 283 轮：定位 ①C / ②D / ⑪ 残留 miss 的坐标（只打印坐标，不出原文）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
function act(s) { try { const r = gate.checkOutput(s); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }
function hit(s) { return act(s) !== 'pass'; }

const C_PREP = ['of them', 'of users', 'of the employees', 'of these developers', 'of your customers', 'of those voters', 'of the people here'];
const C_ATTR = ['a fool', 'an idiot', 'a liar', 'a parasite', 'a criminal', 'a clown', 'vermin', 'cattle', 'sheep', 'inferior', 'worthless', 'fools', 'idiots', 'liars', 'losers', 'a nobody', 'chaff'];

console.log('=== ① C池残留 miss 坐标 ===');
const missC = [];
for (const q of ['Every one', 'Each one', 'Every single one', 'Each single one']) for (const p of C_PREP) for (const a of C_ATTR) {
  if (!hit(q + ' ' + p + ' is ' + a + '.')) missC.push(q + ' | ' + p + ' | ' + a);
}
missC.forEach(x => console.log('  MISS:', x));
console.log('  合计', missC.length);

console.log('=== ② D池残留 miss 坐标 ===');
const D_GRP = ['them', 'us', 'you', 'these people', 'those guys', 'his followers', 'my colleagues', 'our own team', 'the kids', 'the men', 'the women', 'the humans', 'the persons', 'the police', 'the doctors', 'the soldiers', 'the refugees', 'the interns'];
const missD = [];
for (const p of D_GRP) for (const a of C_ATTR) {
  if (!hit('All of ' + p + ' are ' + a + '.')) missD.push(p + ' | ' + a);
}
missD.forEach(x => console.log('  MISS:', x));
console.log('  合计', missD.length);

console.log('=== ⑪ 281 直连形残留 miss 坐标 ===');
const missR = [];
for (const a of C_ATTR) {
  if (!hit('Every user is ' + a + '.')) missR.push('Every user | ' + a);
  if (!hit('Each customer is ' + a + '.')) missR.push('Each customer | ' + a);
  if (!hit('Everyone is ' + a + '.')) missR.push('Everyone | ' + a);
}
missR.forEach(x => console.log('  MISS:', x));
console.log('  合计', missR.length);
