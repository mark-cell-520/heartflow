// 第 284 轮 probe7：精确复测 281 判据群体表 —— 5 个词（player/reader/patient/driver/voter）
// 到底在不在 281 判据（第 4920 行）里。直接 eval 该正则逐词核对，不信 grep。
// 只报数字。
const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8').split('\n');
// 第 4920 行（1-based）= index 4919
const line = lines[4919];
console.log('行号校验（含 every/each 与 is|are）: ' + (/every|each/.test(line) && /(?:is\|are)/.test(line)));
const m = line.match(/^\s*(\/\\b[\s\S]*?\/i),?\s*$/);
console.log('能否解析出正则字面量: ' + !!m);
let src = m[1];
src = src.replace(/^\//, '').replace(/\/i$/, '');
const re = new RegExp(src, 'i');
console.log('正则长度 ' + src.length);

// 判据群体表（281 主判据）里的词
const JUDGE = ['users?', 'customers?', 'developers?', 'managers?', 'teams?', 'analysts?',
  'attendees?', 'operators?', 'volunteers?', 'buyers?', 'sellers?', 'subscribers?', 'visitors?',
  'guests?', 'applicants?', 'respondents?', 'colleagues?', 'neighbors?', 'passengers?',
  'journalists?', 'citizens?', 'taxpayers?', 'investors?', 'recruits?', 'teammates?',
  'newcomers?', 'outsiders?', 'designers?', 'testers?', 'writers?', 'editors?', 'authors?',
  'consumers?', 'engineers?', 'employees?', 'workers?', 'students?', 'members?', 'people',
  'persons?', 'humans?', 'individuals?', 'interns?', 'one'];

// 282/283 判据里的完整群体表（4948 行 every/each one of）
const FULL4948 = ['users?', 'customers?', 'developers?', 'managers?', 'teams?', 'analysts?',
  'attendees?', 'operators?', 'volunteers?', 'buyers?', 'sellers?', 'subscribers?', 'visitors?',
  'guests?', 'applicants?', 'respondents?', 'colleagues?', 'neighbors?', 'passengers?',
  'journalists?', 'citizens?', 'taxpayers?', 'investors?', 'recruits?', 'teammates?',
  'newcomers?', 'outsiders?', 'designers?', 'testers?', 'writers?', 'editors?', 'authors?',
  'consumers?', 'engineers?', 'employees?', 'workers?', 'students?', 'members?', 'people',
  'reviewers?', 'maintainers?', 'admins?', 'clients?', 'patients?', 'drivers?', 'players?',
  'voters?', 'readers?', 'guys?', 'followers?', 'kids?', 'children', 'men', 'women', 'folks',
  'protesters?', 'cops?', 'refugees?', 'soldiers', 'police', 'teachers?', 'nurses?', 'doctors?',
  'riders?', 'staff', 'trainees?', 'cadets?', 'believers?', 'activists?', 'extremists?',
  'moderates?', 'liberals?', 'conservatives?', 'republicans?', 'democrats?', 'herders?',
  'humans?', 'persons?', 'fanatics?', 'interns?', 'individuals?', 'people', 'ones'];

const inJudge = JUDGE.filter(w => re.test('every ' + w.replace('s?', '') + ' is a fool'));
const missing = [];
for (const w of FULL4948) {
  const bare = w.replace('s?', '');
  // 用判据实测
  const ok = re.test('every ' + bare + ' is a fool');
  if (!ok) missing.push(w);
}
console.log('281 判据实测覆盖 4948 表 ' + FULL4948.length + ' 词中 ' + (FULL4948.length - missing.length) + ' 个');
console.log('MISSING_IN_281 ' + JSON.stringify(missing));
// 4949 本行群体表核对
const line4949 = lines[4948];
const m9 = line4949.match(/^\s*(\/\\b[\s\S]*?\/i),?\s*$/);
let src9 = m9[1].replace(/^\//, '').replace(/\/i$/, '');
const re9 = new RegExp(src9, 'i');
const miss9 = [];
for (const w of FULL4948) {
  const bare = w.replace('s?', '');
  if (!re9.test('all of ' + bare + ' are fools')) miss9.push(w);
}
console.log('MISSING_IN_4949 ' + JSON.stringify(miss9));
