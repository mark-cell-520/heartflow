'use strict';
// r379 第二轮诊断：剩余 6 条漏判的腿级归因 + 邻近窗核查。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const dn = require(path.join(ROOT, 'src', 'duration-neglect.js'));
const I = dn.__internals();

const MISS = [
  '实验里被试忍受噪音的时长不影响满意度，只要结尾安静就行。',
  '这部电影前面两个小时再难看也无所谓，结尾精彩就是神作。',
  '军训那十五天多苦都不算事，最后一天会操整齐，整个军训就是好的。',
  '受的罪持续多长时间根本不算数，结局圆满就行。',
  '疗程多长不起作用，症状消失就是痊愈。',
  'The length of the hospital stay makes no difference to patient satisfaction.',
];
function leg(list, t) {
  const hits = [];
  for (const s of list) { const re = new RegExp(s, 'gi'); const m = re.exec(t); if (m) hits.push({ p: m[0], at: m.index, end: m.index + m[0].length }); }
  return hits;
}
for (const t of MISS) {
  const dur = leg(I.DURATION_PHRASE_ZH, t).concat(leg(I.DURATION_PHRASE_EN, t));
  const dec = leg(I.IRRELEVANCE_DECL_ZH, t).concat(leg(I.IRRELEVANCE_DECL_EN, t));
  let dist = 999;
  for (const d of dur) for (const c of dec) {
    const g = Math.max(d.at, c.at) - Math.min(d.end, c.end);
    if (g < dist) dist = g;
  }
  console.log(JSON.stringify(t.slice(0, 30)) + ' dur=' + dur.length + ' dec=' + dec.length + ' dist=' + dist +
    (dur.length ? ' [' + dur.map(x => x.p).join('|') + ']' : '') + (dec.length ? ' [' + dec.map(x => x.p).join('|') + ']' : ''));
}
