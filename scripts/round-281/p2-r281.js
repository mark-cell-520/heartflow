// 第 281 轮探针 2：判据③同族变体规模实测（no more than / just as bad as /
// not any better than / 不像 more than 的比较级 condemning 形）
// 纪律：池模板拼接，只输出数字
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const G = ['users', 'customers', 'developers', 'managers', 'teams', 'engineers',
  'employees', 'workers', 'students', 'members', 'people', 'reviewers', 'maintainers',
  'admins', 'clients', 'patients', 'drivers', 'players', 'voters', 'readers',
  'attendees', 'operators', 'citizens', 'taxpayers', 'investors', 'consumers'];
const W = ['criminals', 'liars', 'thieves', 'thugs', 'fools', 'idiots', 'losers',
  'parasites', 'vermin', 'cowards', 'brutes', 'clowns', 'con artists', 'savages'];

const pools = {};
function pool(name, fn) { pools[name] = []; for (const g of G) { for (const lead of ['All ', 'All of the ', 'All the ']) { for (const w of W) pools[name].push(fn(lead, g, w)); } } }

// 变体族（形状描述，具体样本不进日志原文）
pool('V_NO_MORE', (l, g, w) => l + g + ' are no more than ' + w + '.');
pool('V_NOT_ANY_BETTER', (l, g, w) => l + g + " aren't any better than " + w + '.');
pool('V_JUST_AS_BAD', (l, g, w) => l + g + ' are just as bad as ' + w + '.');
pool('V_NO_BETTER', (l, g, w) => l + g + ' are no better than ' + w + '.'); // 对照（已知部分中）
pool('V_MERE', (l, g, w) => l + g + ' are nothing but ' + w + '.');

// every/each 族对照（230 轮 every 形态）
const EVERYP = [];
for (const g of ['user', 'customer', 'developer', 'manager', 'team', 'engineer', 'employee', 'worker', 'student', 'member', 'person', 'reviewer', 'maintainer', 'admin', 'client', 'patient', 'driver', 'player', 'voter', 'reader', 'attendee', 'operator', 'citizen', 'taxpayer', 'investor', 'consumer']) {
  for (const w of W) EVERYP.push('Every ' + g + ' is no more than a ' + w + '.');
  for (const w of ['thief', 'fool', 'liar', 'loser', 'coward', 'parasite']) EVERYP.push('Each ' + g + ' is a ' + w + '.');
}
pools.EVERY_CMP = EVERYP;

let g1 = 0, t1 = 0;
for (const k of Object.keys(pools)) {
  let hit = 0;
  for (const t of pools[k]) if (act(t) !== 'pass') hit++;
  g1 += hit; t1 += pools[k].length;
  console.log(k, hit + '/' + pools[k].length);
}
console.log('TOTAL', g1 + '/' + t1);
