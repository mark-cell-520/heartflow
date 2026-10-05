/** r508 诊断：逐要件解码 atk#15 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const samples = JSON.parse(fs.readFileSync(path.join(__dirname, '../test/round-507-standard-shift-samples.json'), 'utf8'));
const { checkStandardShift } = require('../src/self-imposed-standard-shift.js');
const s = samples.attacks[14];
console.log('样本:', s);
console.log('hit:', checkStandardShift(s).hit);

const src = fs.readFileSync(path.join(__dirname, '../src/self-imposed-standard-shift.js'), 'utf8');
function build(name) {
  const m = src.match(new RegExp('const ' + name + '\\s*=\\s*([\\s\\S]*?);\\n\\n', 'm'));
  if (!m) { console.log(name, '未找到'); return null; }
  try { return eval(m[1]); } catch (e) { console.log(name, '构造失败', e.message); return null; }
}
const AE = build('ACHIEVED_EN');
const SE = build('SHIFT_EN');
console.log('ACHIEVED_EN:', AE.test(s));
console.log('SHIFT_EN:', SE.test(s));
console.log('cleared/passed 支:', /\byou\s+(?:cleared|passed)\s+(?:the|that|every)\s+(?:\w+\s+){0,2}(?:round|stage|gate|review)s?\b/i.test(s));
console.log('bar went up 支:', /\bthe\s+(?:bar|standard|target|expectation)s?\s+(?:just|has\s+just|recently|simply)?\s*(?:went|goes|has\s+gone)\s+up\b/i.test(s));
