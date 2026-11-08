const att = require('/data/home/heartflow/src/appeal-tradition.js');
const I = att.__internals();
const t = 'It is untouchable — a time-honored practice you cannot question.';
console.log('TRADITION_EN:', I.TRADITION_EN.test(t));
console.log('SUPPRESS_EN:', I.SUPPRESS_EN.test(t));
console.log('module normal:', JSON.stringify(att.checkAppealToTradition(t)));
console.log('module killed:', JSON.stringify(att.checkAppealToTradition(t, {
  TRAD_ZH_BRANCHES: {}, TRAD_EN_BRANCHES: {},
  SUPP_ZH_BRANCHES: {}, SUPP_EN_BRANCHES: {},
  CONCL_ZH_BRANCHES: {}, CONCL_EN_BRANCHES: {},
})));
// guidance 原文
const fs = require('fs');
const src = fs.readFileSync('/data/home/heartflow/src/index.js', 'utf8');
const i = src.indexOf("'appeal_to_tradition': '");
console.log('GUIDANCE:', JSON.stringify(src.slice(i, i + 160)));
// gate 层良性候选
const gate = require('/data/home/heartflow/src/gate.js');
const cands = [
  '传统戏曲就是这样演的，观众爱看。',
  'Time-tested methods deserve respect, not immunity from testing.',
  '这家百年老店去年翻新了门面。',
  'Old-school craftsmanship requires years of apprenticeship.',
  '祖上传下来的秘方我们已经做了成分检测，论文发表在药理期刊上。',
  'The status quo has served us well, and the data confirms it still works.',
  'We compared the century-old recipe with the modern one.',
  '公司沿用旧命名规范只为兼容历史代码',
];
for (const c of cands) {
  const g = gate.gate(c);
  console.log((g.gate.action === 'pass' ? 'PASS ' : g.gate.action + ' ') + JSON.stringify(c) + ' :: ' + ((g.findings || []).map(f => f.dimension).join(',')));
}
