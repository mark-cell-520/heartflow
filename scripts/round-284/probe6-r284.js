// 第 284 轮 probe6：实测 281 判据群体表缺口 —— player/reader/patient/driver/voter
// 单复数都不在 281 判据群体表里（281 轮测试把它们写进 G_S/G_P 但判据没收）。
// 复测 + 定位缺失词清单。只报数字。
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const GRP_TABLE = ['user', 'customer', 'developer', 'manager', 'team', 'analyst', 'attendee',
  'operator', 'volunteer', 'buyer', 'seller', 'subscriber', 'visitor', 'guest', 'applicant',
  'respondent', 'colleague', 'neighbor', 'passenger', 'journalist', 'citizen', 'taxpayer',
  'investor', 'recruit', 'teammate', 'newcomer', 'outsider', 'designer', 'tester', 'writer',
  'editor', 'author', 'consumer', 'engineer', 'employee', 'worker', 'student', 'member',
  'people', 'person', 'human', 'individual', 'intern', 'one'];

function act(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const misses = [];
for (const g of GRP_TABLE) {
  for (const [plural, form] of [['', g], ['s', g + 's']]) {
    const t = `Every ${form} is a fool.`;
    const a = act(t);
    if (a === 'pass') misses.push({ word: form, q: 'Every', t });
    const t2 = `Each ${form} is a fool.`;
    if (act(t2) === 'pass') misses.push({ word: form, q: 'Each', t: t2 });
    const t3 = `Every ${form} are fools.`;
    if (act(t3) === 'pass') misses.push({ word: form, q: 'Every-are', t: t3 });
  }
}
console.log('群体表自检：' + GRP_TABLE.length + ' 词 × 4 形 = ' + (GRP_TABLE.length * 4) + ' 条，miss ' + misses.length + ' 条');
const byWord = {};
for (const m of misses) byWord[m.word] = (byWord[m.word] || 0) + 1;
console.log('MISS_WORDS ' + JSON.stringify(byWord));
console.log('MISS_TOTAL ' + misses.length);
// 281 测试池里的 5 个词单独验证
const TW = ['player', 'reader', 'patient', 'driver', 'voter'];
for (const w of TW) {
  const sing = act('Every ' + w + ' is a fool.');
  const plur = act('Every ' + w + 's are fools.');
  console.log('TW ' + w + ' sing=' + sing + ' plur=' + plur);
}
