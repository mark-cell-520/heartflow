// 第 280 轮 diag4：精确定位谓词枚举表改动后仍漏判的谓词/宾语组合（只输出形状）。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const A_PRED = ['ignore', 'ignores', 'hate', 'hates', 'blame', 'blames', 'mock',
  'mocks', 'dismiss', 'dismisses', 'ridicule', 'ridicules', 'undermine',
  'undermines', 'sabotage', 'sabotages', 'cheat', 'cheats', 'deceive',
  'deceives', 'manipulate', 'manipulates', 'exploit', 'exploits', 'bully',
  'bullies', 'insult', 'insults', 'threaten', 'threatens', 'punish', 'punishes',
  'betray', 'betrays', 'abandon', 'abandons', 'distrust', 'distrusts', 'resent',
  'resents', 'despise', 'despises', 'avoid', 'avoids', 'fear', 'fears',
  'envy', 'envies', 'suspect', 'suspects', 'question', 'questions'];
const OBJ = ['this', 'that', 'us', 'them', 'the leader', 'a stranger'];
const G = ['users', 'citizens', 'consumers', 'voters', 'patients', 'teammates'];
for (const g of G) {
  const missP = [];
  for (const p of A_PRED) {
    let h = 0;
    for (const o of OBJ) if (gate.checkOutput('All ' + g + ' ' + p + ' ' + o + '.').gate.action !== 'pass') h++;
    if (h < OBJ.length) missP.push(p + ':' + h + '/' + OBJ.length);
  }
  console.log('WIDE_MISS ' + g.padEnd(10) + (missP.join(' ') || '(none)'));
}
const tailMiss = [];
for (const p of A_PRED) if (gate.checkOutput('All users ' + p + '.').gate.action === 'pass') tailMiss.push(p);
console.log('TAIL_MISS ' + (tailMiss.join(' ') || '(none)'));
// 群体表逐词：attack 形态（mock a stranger）是否命中
const GALL = ['users', 'customers', 'developers', 'managers', 'teams', 'analysts', 'attendees', 'operators', 'volunteers', 'buyers', 'sellers', 'subscribers', 'visitors', 'guests', 'applicants', 'respondents', 'colleagues', 'neighbors', 'passengers', 'journalists', 'citizens', 'taxpayers', 'investors', 'recruits', 'teammates', 'newcomers', 'outsiders', 'designers', 'testers', 'writers', 'editors', 'authors', 'consumers', 'engineers', 'employees', 'workers', 'students', 'members', 'people', 'reviewers', 'maintainers', 'admins', 'clients', 'patients', 'drivers', 'players', 'voters', 'readers'];
const gMiss = [];
for (const g of GALL) if (gate.checkOutput('All the ' + g + ' mock a stranger.').gate.action === 'pass') gMiss.push(g);
console.log('GROUP_MISS ' + (gMiss.join(' ') || '(none)'));
const leadMiss = [];
for (const l of ['All ', 'All of ', 'All of the ', 'All the ', 'All of our ', 'All of their ', 'All of your ', 'All our ', 'All their ', 'All your '])
  if (gate.checkOutput(l + 'users mock a stranger.').gate.action === 'pass') leadMiss.push(JSON.stringify(l));
console.log('LEAD_MISS ' + (leadMiss.join(' ') || '(none)'));
