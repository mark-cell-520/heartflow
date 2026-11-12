/* r309 调试：失配攻击的腿①/腿②逐族诊断 */
'use strict';
const SODV = require('/data/home/heartflow/src/selection-on-dependent-variable.js');
const I = SODV.__internals();

const misses = [
  '梳理了上榜企业的财报，它们清一色都做过社群运营，所以做社群就能上榜',
  '业绩冠军都写复盘，所以写复盘决定业绩',
  '学霸都不上补习班，所以不上补习班就能成学霸',
  '康复的患者，他们都心态乐观，所以乐观能治好病',
  '闯出来的创业者，他们个个敢赌，所以敢赌让人闯出来',
];

for (const t of misses) {
  console.log('--- ' + t);
  for (const [name, list] of [['SELECT_ZH', I.SELECT_ZH], ['SELECT2_ZH', I.SELECT2_ZH], ['CAUSE_ZH', I.CAUSE_ZH], ['CAUSE2_ZH', I.CAUSE2_ZH]]) {
    const hits = [];
    list.forEach((re, i) => { if (re.test(t)) hits.push(i); });
    console.log('  ' + name + ' 命中元素: [' + hits.join(',') + ']');
  }
  const r = SODV.detectSelectionOnDependentVariable(t);
  console.log('  detect: hit=' + r.hit + ' details=' + (r.details || '').slice(0, 60));
}
