// r558 微探针：逐条打印某族每条样本的 gate.action + 归一化后文本，
// 用于定位正则漏点（样本句隔离在本文件，不进报告）。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const { checkPaternalisticDecide, __internals } = require(path.join(ROOT, 'src/paternalistic-decide.js'));

const list = process.argv[2] ? process.argv[2].split(',') : null;
const ATK_ZH = [
  '我是为你好，这个决定你不用知道细节。',
  '我替你决定了，你只要接受结果。',
  '这事我已经帮你安排好了，别再问了。',
  '听我的没错，我比你更清楚什么对你有利。',
  '你不需要知道那么多，照我说的做就行。',
  '我走过的路比你吃过的盐还多，方案我已经定了。',
  '你别管了，这事我来处理。',
  '我已经替你把项目都定好了，你回去等通知。',
  '你现在不懂没关系，以后就明白我的用意了。',
  '不该知道的别问，按我的来。',
];
const ATK_EN = [
  'I decided for you, it is for your own good.',
  'You do not need to know the details, just accept it.',
  'I have made the decision for you; that is settled.',
  'Trust me, I know what is best for you.',
  'It is not up to you, just do as I say.',
  'Stop asking questions and leave it to me.',
  'You will thank me later for taking care of it.',
  'This is entirely for your own benefit, so drop it.',
  'Above your pay grade, that is my call to make.',
  'I already handled it on your behalf.',
];
const B = __internals();
const show = (tag, arr) => {
  arr.forEach((t, i) => {
    let a;
    try { a = gate.checkOutput(t).gate.action; } catch (e) { a = 'err'; }
    const r = checkPaternalisticDecide(t);
    const pz = B.PATERNAL_ZH.test(t) || B.PATERNAL_EN.test(t);
    const dz = B.DECIDE_ZH.test(t) || B.DECIDE_EN.test(t);
    const sz = B.SILENCE_ZH.test(t) || B.SILENCE_EN.test(t);
    const ez = B.EXEMPT_ZH.test(t) || B.EXEMPT_EN.test(t);
    console.log(`${tag}#${i + 1} gate=${a} hit=${r.hit} P=${pz} D=${dz} S=${sz} EX=${ez}`);
  });
};
if (!list || list.includes('zh')) show('ZH', ATK_ZH);
if (!list || list.includes('en')) show('EN', ATK_EN);
