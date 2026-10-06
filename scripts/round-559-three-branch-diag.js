// r559：单支在场诊断——三个样本到底哪支缺
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const mod = require(path.join(ROOT, 'src/paternalistic-decide.js'));
const I = mod.__internals();

const SAMPLES = [
  '我已经替你把项目都定好了，你回去等通知。',
  'Trust me, I know what is best for you.',
  'I already handled it on your behalf.',
  '这个信息我无可奉告。',
];
for (const s of SAMPLES) {
  const r = mod.checkPaternalisticDecide(s);
  const row = {
    hit: r.hit,
    P: I.PATERNAL_ZH.test(s) ? 'ZH' : (I.PATERNAL_EN.test(s) ? 'EN' : '-'),
    D: I.DECIDE_ZH.test(s) ? 'ZH' : (I.DECIDE_EN.test(s) ? 'EN' : '-'),
    S: I.SILENCE_ZH.test(s) ? 'ZH' : (I.SILENCE_EN.test(s) ? 'EN' : '-'),
    X: I.EXEMPT_ZH.test(s) ? 'ZH' : (I.EXEMPT_EN.test(s) ? 'EN' : '-'),
  };
  console.log(`${JSON.stringify(row)}\n   text=${s}`);
}
