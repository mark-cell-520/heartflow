// 第 284 轮 probe7b：4949 行的误判修正（all of 形无需裸词匹配），
// 改用 281/282/283 判据的实际形状实测：`all of the <词> are fools.`
const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8').split('\n');

function reAt(idx) {
  const m = lines[idx].match(/^\s*(\/\\b[\s\S]*?\/i),?\s*$/);
  const src = m[1].replace(/^\//, '').replace(/\/i$/, '');
  return new RegExp(src, 'i');
}
const re281 = reAt(4919);   // every/each 系动词属性句主判据
const re4948 = reAt(4947);  // every/each one of ...
const re4949 = reAt(4948);  // all of ... are ...

const WORD_SETS = {
  base: ['users?', 'customers?', 'developers?', 'managers?', 'teams?', 'analysts?', 'attendees?', 'operators?',
    'volunteers?', 'buyers?', 'sellers?', 'subscribers?', 'visitors?', 'guests?', 'applicants?', 'respondents?',
    'colleagues?', 'neighbors?', 'passengers?', 'journalists?', 'citizens?', 'taxpayers?', 'investors?',
    'recruits?', 'teammates?', 'newcomers?', 'outsiders?', 'designers?', 'testers?', 'writers?', 'editors?',
    'authors?', 'consumers?', 'engineers?', 'employees?', 'workers?', 'students?', 'members?', 'people',
    'persons?', 'humans?', 'individuals?', 'interns?', 'one'],
  extra4948: ['reviewers?', 'maintainers?', 'admins?', 'clients?', 'patients?', 'drivers?', 'players?', 'voters?',
    'readers?', 'guys?', 'followers?', 'kids?', 'children', 'men', 'women', 'folks', 'protesters?', 'cops?',
    'refugees?', 'soldiers', 'police', 'teachers?', 'nurses?', 'doctors?', 'riders?', 'staff', 'trainees?',
    'cadets?', 'believers?', 'activists?', 'extremists?', 'moderates?', 'liberals?', 'conservatives?',
    'republicans?', 'democrats?', 'herders?', 'fanatics?', 'ones'],
};

function hits(re, tpl, w) { const bare = w.replace('s?', ''); return re.test(tpl(bare)); }

const miss281 = WORD_SETS.base.filter(w => !hits(re281, b => 'every ' + b + ' is a fool.', w));
const miss4948 = [...WORD_SETS.base, ...WORD_SETS.extra4948].filter(w => !hits(re4948, b => 'every one of ' + b + ' is a fool.', w));
const miss4949 = [...WORD_SETS.base, ...WORD_SETS.extra4948].filter(w => !hits(re4949, b => 'all of the ' + b + ' are fools.', w));

console.log('281 判据（base 表 ' + WORD_SETS.base.length + ' 词）miss: ' + miss281.length + ' → ' + JSON.stringify(miss281));
console.log('4948 判据（全表 ' + (WORD_SETS.base.length + WORD_SETS.extra4948.length) + ' 词）miss: ' + miss4948.length);
console.log('  4948_MISS ' + JSON.stringify(miss4948));
console.log('4949 判据（全表）miss: ' + miss4949.length);
console.log('  4949_MISS ' + JSON.stringify(miss4949));
