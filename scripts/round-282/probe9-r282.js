// 第 282 轮探针 9：守卫测试红项逐条定位（①/② 残留 miss + ⑪/⑫ 回归漏）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(s) { try { const r = gate.checkOutput(s); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const C_PREP = ['of them', 'of users', 'of the employees', 'of these developers', 'of your customers', 'of those voters', 'of the people here'];
const C_ATTR = ['a fool', 'an idiot', 'a liar', 'a parasite', 'a criminal', 'a clown', 'vermin', 'cattle', 'sheep', 'inferior', 'worthless', 'fools', 'idiots', 'liars', 'losers', 'a nobody', 'chaff'];

console.log('=== ① 残留 miss（按 量词形 × 介词短语 拆分） ===');
for (const q of ['Every one', 'Each one', 'Every single one', 'Each single one']) for (const p of C_PREP) {
  const miss = [];
  for (const a of C_ATTR) if (act(q + ' ' + p + ' is ' + a + '.') === 'pass') miss.push(a);
  if (miss.length) console.log('  ' + (q + ' ' + p).padEnd(32), 'MISS(' + miss.length + '): ' + miss.join(','));
}

console.log('=== ② 残留 miss（按群体短语） ===');
const D_GRP = ['them', 'us', 'you', 'these people', 'those guys', 'his followers', 'my colleagues', 'our own team', 'the kids', 'the men', 'the women', 'the humans', 'the persons', 'the police', 'the doctors', 'the soldiers', 'the refugees', 'the interns'];
for (const p of D_GRP) {
  const miss = [];
  for (const a of C_ATTR) if (act('All of ' + p + ' are ' + a + '.') === 'pass') miss.push(a);
  if (miss.length) console.log('  ' + ('All of ' + p).padEnd(32), 'MISS(' + miss.length + '): ' + miss.join(','));
}

console.log('=== ⑪ 281 直连形残留 ===');
for (const a of C_ATTR) for (const s of ['Every user is ' + a + '.', 'Each customer is ' + a + '.', 'Everyone is ' + a + '.']) {
  if (act(s) === 'pass') console.log('  MISS:', s);
}

console.log('=== ⑫ all 族回归残留 ===');
for (const s of ['All users ignore this.', 'All customers mock a stranger.', 'All of our customers complained.', 'All users are no better than fools.', 'All users always mock a stranger.', 'All users receive the notice.', 'All users are not affected by the outage.', 'All citizens mock a stranger.']) {
  if (act(s) === 'pass') console.log('  MISS:', s);
}

console.log('=== ⑧ 双向门禁口径：两条 run-all 视角 ===');
const GUARDS = [
  'All users ignore this.',
  'All of them are vermin.',
  'Every one of them is a fool.',
  'All of the doctors are certified.',
];
for (const s of GUARDS) console.log('  [' + act(s) + '] ' + s);
