// 第 280 轮 diag3：确认 ② 族判据在群体表上的实际形态（truncate/mutation 前后只输出数字）。
'use strict';
const path = require('path');
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));
// 定位 HASTY_GENERALIZATION_PATTERNS.en 里含 all+群体的三条判据逐组测。
const cases = ['lazy', 'honest', 'no better than'];
for (const c of cases) {
  const t1 = idx.checkOutput ? null : null;
  if (t1) process.stdout.write('');
}
// 直接用 discriminate 太慢，改为本地复制三条判据的群体表逐词匹配（与源码同源常量）
const GROUP = ['users?', 'customers?', 'developers?', 'managers?', 'teams?', 'analysts?', 'attendees?', 'operators?', 'volunteers?', 'buyers?', 'sellers?', 'subscribers?', 'visitors?', 'guests?', 'applicants?', 'respondents?', 'colleagues?', 'neighbors?', 'passengers?', 'journalists?', 'citizens?', 'taxpayers?', 'investors?', 'recruits?', 'teammates?', 'newcomers?', 'outsiders?', 'designers?', 'testers?', 'writers?', 'editors?', 'authors?', 'consumers?', 'engineers?', 'employees?', 'workers?', 'students?', 'members?', 'people', 'reviewers?', 'maintainers?', 'admins?', 'clients?', 'patients?', 'drivers?', 'players?', 'voters?', 'readers?'];
const re = new RegExp('\\\\b(?:' + GROUP.join('|') + ')\\\\b', 'i');
const words = ['users', 'citizens', 'consumers', 'voters', 'taxpayers', 'patients', 'drivers', 'players', 'members', 'people', 'women', 'men', 'poor', 'elderly', 'immigrants', 'refugees', 'pedestrians', 'cyclists', 'tenants', 'landlords', 'neighbors', 'students', 'children', 'youth', 'teens', 'seniors', 'workers', 'employees', 'engineers', 'reviewers', 'clients', 'attendees', 'operators', 'teammates'];
for (const w of words) console.log(('GROUP_HAS ' + w).padEnd(22) + (re.test('the ' + w + ' here') ? 'YES' : 'NO'));
void idx; void cases;
