'use strict';
// r379 逐条诊断：漏判攻击句的腿级归因。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const dn = require(path.join(ROOT, 'src', 'duration-neglect.js'));

const MISS = [
  '这部电影前面两个小时再难看也无所谓，结尾精彩就是神作。',
  '军训那十五天多苦都不算事，最后一天会操整齐，整个军训就是好的。',
  '受的罪持续多长时间根本不算数，结局圆满就行。',
  '疗程多长不起作用，症状消失就是痊愈。',
  '排队等了几个小时不重要，最后买到就行。',
  'The length of the hospital stay makes no difference to patient satisfaction.',
  '结局当然重要，但过程持续了多久也是评价的一部分，不能只看两端。',
];
const I = dn.__internals();
const leg = (list, t) => {
  const hits = [];
  for (const s of list) { const re = new RegExp(s, 'gi'); const m = re.exec(t); if (m) hits.push(m[0]); }
  return hits;
};
for (const t of MISS) {
  const durZh = leg(I.DURATION_PHRASE_ZH, t);
  const decZh = leg(I.IRRELEVANCE_DECL_ZH, t);
  const durEn = leg(I.DURATION_PHRASE_EN, t);
  const decEn = leg(I.IRRELEVANCE_DECL_EN, t);
  console.log(JSON.stringify(t.slice(0, 32)));
  console.log('  durZH=' + JSON.stringify(durZh) + ' decZH=' + JSON.stringify(decZh) + ' durEN=' + JSON.stringify(durEn) + ' decEN=' + JSON.stringify(decEn));
}
