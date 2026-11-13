/* r314 调试：pristine present-bias（d8214c7 版）对关键样本的行为 */
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const src = execSync('git show d8214c7:src/present-bias.js', { cwd: '/data/home/heartflow', maxBuffer: 1e8 }).toString();
const tmp = path.join(os.tmpdir(), 'pb-pristine-r314.js');
fs.writeFileSync(tmp, src);
const PB = require(tmp);
const I = PB.__internals();
console.log('有 NOW_ZH2 键?', 'NOW_ZH2' in I);
const cases = [
  '今朝有酒今朝醉，体检以后再说',
  '能玩一天是一天，作业明天再说',
  '减肥下次一定，今晚这顿火锅先痛快吃了',
  '相信后人的智慧，现在先舒服了',
  "I'll start tomorrow, tonight I want to enjoy what I can actually feel",
  'You only live once, who cares what happens tomorrow',
];
for (const t of cases) {
  const r = PB.detectPresentBias(t);
  console.log(r.hit ? 'HIT ' : 'miss', '|', t.slice(0, 42));
}
