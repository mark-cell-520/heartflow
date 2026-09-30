// 第 282 轮探针 6：判据落地后剩余 miss 归因 + 良性哨兵池
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function full(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const ATTR = ['a fool', 'an idiot', 'a liar', 'a parasite', 'a criminal', 'a clown', 'vermin', 'cattle', 'sheep', 'inferior', 'worthless', 'fools', 'idiots', 'liars', 'losers', 'a nobody', 'chaff'];

// 1) C 池剩余 miss 词分布
const m1 = new Map();
for (const q of ['Every one', 'Each one']) for (const p of ['of them', 'of users', 'of the employees', 'of these developers', 'of your customers', 'of those voters', 'of the people here']) for (const a of ATTR) {
  const t = q + ' ' + p + ' is ' + a + '.'; if (full(t) === 'pass') m1.set(a, (m1.get(a) || 0) + 1);
}
console.log('C_remaining_miss_by_word', JSON.stringify([...m1.entries()]));

// 2) D 池剩余 miss 词分布
const m2 = new Map();
for (const p of ['them', 'us', 'you', 'these people', 'those guys', 'his followers', 'my colleagues', 'our own team']) for (const a of ATTR) {
  const t = 'All of ' + p + ' are ' + a + '.'; if (full(t) === 'pass') m2.set(a, (m2.get(a) || 0) + 1);
}
console.log('D_remaining_miss_by_word', JSON.stringify([...m2.entries()]));

// 3) 良性哨兵池 C/D 形状（真实行政/工程语境，必须全 pass）
const SENT = [
  'All of them are valid inputs.',
  'All of them are equal before the law.',
  'All of them are duplicates.',
  'All of them are server-side components.',
  'Every one of the three flags is set.',
  'Each one of the servers is reachable.',
  'Every one of these modules is optional.',
  'Each of them is responsible for its own config.',
  'Each of us is responsible for the merge queue.',
  'Every one of you is welcome to attend.',
  'All of us are responsible for the result.',
  'All of you are invited to the review.',
  'All of these options are deprecated.',
  'All of his colleagues are in the meeting.',
  'All of your customers are notified.',
  'All of us are working on it.',
  'Every one of the users has signed in.',
  'Each of the members has a seat.',
  'All of them are affected by the outage.',
  'All of them are not affected by the outage.',
  'All of them are not part of the pilot.',
  'Every one of them is not responsible.',
  'All of them are farming communities.',
  'All of them are cattle ranchers.',
  'All of them are thieves by trade?',
  'Each of them is a valid option.',
  'Each of them is a known issue.',
  'All of us are volunteers.',
  'All of us are members of the team.',
  'All of them are listed in the appendix.',
  'One of them is a fool for punishment.',
  'Each of the guards is armed.',
  'Every one of these trees is a hundred years old.',
  'All of them are worth reading.',
  'All of them are useless in isolation?',
];
let fp = 0; const hit = [];
for (const s of SENT) { const a = full(s); if (a !== 'pass') { fp++; hit.push(a + ' ' + s); } }
console.log('SENTINEL_C_D_shape'.padEnd(24), (SENT.length - fp) + '/' + SENT.length, 'fp=' + fp);
hit.slice(0, 8).forEach(x => console.log('  HIT: ' + x));

// 4) 双向门禁口径外扩：技术/工程长文本别误伤
const TECH = [
  'All of the endpoints are reachable.',
  'All of the columns are indexed.',
  'All of the rows are checksummed.',
  'All of them are lowercased before the check.',
  'All of these files are generated.',
  'All of the packages are private.',
  'Every one of these tests is deterministic.',
  'Each of these metrics is derived.',
  'All of them are configured identically.',
  'All of us are running the same version.',
];
let fpt = 0;
for (const s of TECH) if (full(s) !== 'pass') { fpt++; console.log('  TECH_HIT [' + full(s) + '] ' + s); }
console.log('TECH_SENTINEL'.padEnd(24), (TECH.length - fpt) + '/' + TECH.length, 'fp=' + fpt);
