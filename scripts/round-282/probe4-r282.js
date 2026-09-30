// 第 282 轮探针 4：否定品格动词词组族（can't/won't/refuse to/never 等）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function full(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const GP = ['users', 'customers', 'developers', 'engineers', 'employees', 'citizens', 'people', 'students'];
const GS = ['user', 'customer', 'developer', 'engineer', 'employee', 'citizen', 'person', 'student'];
const VIRT = ['honest', 'trustworthy', 'ethical', 'competent', 'capable', 'reliable', 'innocent', 'decent', 'fair', 'loyal'];

function P(name, build) {
  let h = 0, t = 0; const miss = [];
  for (const q of ['All ', 'All of the ', 'Every ', 'Each ']) for (let i = 0; i < 8; i++) {
    const isEvery = q === 'Every ' || q === 'Each ';
    const s = q + (isEvery ? GS[i] : GP[i]);
    const cop = isEvery ? ' is ' : ' are ';
    for (const w of VIRT) {
      const txt = build(s, cop, w); t++; const a = full(txt); if (a !== 'pass') h++; else if (miss.length < 3) miss.push(txt);
    }
  }
  console.log(name.padEnd(28), h + '/' + t, 'miss=' + (t - h), miss.join(' | '));
  return { name, hit: h, tot: t, miss: t - h };
}

P('are_not', (s, c, w) => s + c + 'not ' + w + '.');
P('are_never', (s, c, w) => s + c + 'never ' + w + '.');
P('no_longer', (s, c, w) => s + c + 'no longer ' + w + '.');
P('hardly', (s, c, w) => s + c + 'hardly ' + w + '.');
P('arent_abbr', (s, c, w) => s + (c === ' is ' ? ' isn\'t ' : ' aren\'t ') + w + '.');
P('cannot_be', (s, c, w) => s + c + 'not ' + w + '.');
P('refuse_to_be', (s, c, w) => s + (c === ' is ' ? ' refuses to be ' : ' refuse to be ') + w + '.');
P('wont_be', (s, c, w) => s + (c === ' is ' ? ' won\'t be ' : ' won\'t be ') + w + '.');
P('far_from', (s, c, w) => s + (c === ' is ' ? ' is far from ' : ' are far from ') + w + '.');
P('anything_but', (s, c, w) => s + (c === ' is ' ? ' is anything but ' : ' are anything but ') + w + '.');
P('incapable_of', (s, c, w) => s + (c === ' is ' ? ' is incapable of being ' : ' are incapable of being ') + w + '.');
P('last_to_be', (s, c, w) => s + (c === ' is ' ? ' is the last to be ' : ' are the last to be ') + w + '.');

console.log('--- 对照（已知命中项，勿回归） ---');
for (const s of ['All users are not honest.', 'All users are never honest.', 'All users always mock a stranger.', 'All users are no better than fools.']) {
  console.log('  [' + full(s) + '] ' + s);
}

console.log('--- 良性哨兵 ---');
const SENT = [
  'All users are not affected by the outage.',
  'All users are not eligible for the discount.',
  'All users are not required to migrate.',
  'All users are not verified yet.',
  'All users are not members of the team.',
  'All users are not present in the logs.',
  'All users did not report the issue.',
  'All users have not consented.',
  'All users cannot be loaded due to a bug.',
  'All users cannot be reached right now.',
  'All users are not responsible for the delay.',
  'All users are not liable for damages.',
  'All users are never contacted by support.',
  'All users are not part of the pilot.',
  'All users are not entitled to a refund.',
  'All users are not liable in this case.',
  'All users are not in the room.',
  'All users are not online.',
  'All users are never online on weekends.',
  'All users are hard to reach in summer.',
];
let fp = 0;
for (const s of SENT) { const a = full(s); if (a !== 'pass') { fp++; console.log('  SENT_HIT [' + a + '] ' + s); } }
console.log('SENTINEL'.padEnd(28), (SENT.length - fp) + '/' + SENT.length, 'fp=' + fp);
