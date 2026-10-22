/** r508：从模块源码里直接抽取 SHIFT_EN/ACHIEVED_EN 实际构造体并逐支测 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../src/self-imposed-standard-shift.js'), 'utf8');
const s = 'You passed the interview round, yet the bar for this role just went up.';

function build(name) {
  const m = src.match(new RegExp('const ' + name + '\\s*=\\s*([\\s\\S]*?);\\n\\n', 'm'));
  if (!m) { console.log(name, '抽取失败'); return null; }
  // eslint-disable-next-line no-eval
  return eval(m[1]);
}
const AE = build('ACHIEVED_EN');
const SE = build('SHIFT_EN');
console.log('ACHIEVED_EN =', AE.test(s));
console.log('SHIFT_EN =', SE.test(s));
// 逐支拆分 SHIFT_EN 找出谁在匹配
const m = src.match(/const SHIFT_EN = new RegExp\(\s*([\s\S]*?),\s*\n\s*'i'\s*\);/);
if (m) {
  const branches = m[1].split('+\n').length;
  console.log('SHIFT_EN 拼接段数 ≈', branches);
}
console.log('isZh:', /[\u4e00-\u9fff]/.test(s));
