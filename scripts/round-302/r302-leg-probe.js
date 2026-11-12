'use strict';
// r302 腿级归因探针：定位 A1/A2 经典族穿透的具体断腿点
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const I = require(path.join(ROOT, 'src/regression-to-the-mean.js')).__internals();

const ZH = [
  ['A1 考第一', '上次考试他考了第一，这次考差了，说明上次的补课班起了反作用。'],
  ['A3 冠军', '他这个月业绩是冠军，上个月只是普通水平，所以那个激励政策根本没用。'],
  ['D1 医学', '病人疼得最厉害的时候吃了这个药，后来不疼了，所以这药有效。'],
  ['G1 良性', '他上次考第一有运气成分，这次成绩回落属于均值回归，不能说明补课班有害。'],
  ['G4 良性', '新教练接手后球队成绩提升，但样本太少，还需要看完整赛季。'],
];
const EN = [
  ['A2 high+fall', 'The stock hit an all-time high last quarter and fell this quarter, proving the buyback backfired.'],
  ['A2b first year', 'She was the top performer in her first year and declined afterwards, so the promotion was a mistake.'],
  ['D2 remedy', 'Her pain was at its worst when she took the remedy and it eased afterwards, so the remedy works.'],
  ['G2 benign', 'A single peak score is not evidence that the tutoring worked; regression to the mean explains it.'],
];

function report(lang, rows) {
  const P = name => I[name] || [];
  const keys = lang === 'ZH'
    ? { low: 'EXTREME_LOW_ZH', high: 'EXTREME_HIGH_ZH', up: 'REG_UP_ZH', down: 'REG_DOWN_ZH', iv: 'INTERVENE_ZH', cr: 'CREDIT_ZH', ef: 'EFFECT_ZH', mzh: 'EXEMPT_META_ZH', evzh: 'EXEMPT_EVID_ZH', nzh: 'EXEMPT_NEG_ZH', hzh: 'EXEMPT_HEDGE_ZH' }
    : { low: 'EXTREME_LOW_EN', high: 'EXTREME_HIGH_EN', up: 'REG_UP_EN', down: 'REG_DOWN_EN', iv: 'INTERVENE_EN', cr: 'CREDIT_EN', ef: 'EFFECT_EN', mzh: 'EXEMPT_META_EN', evzh: 'EXEMPT_EVID_EN', nzh: 'EXEMPT_NEG_EN', hzh: 'EXEMPT_HEDGE_EN' };
  console.log(`\n########## ${lang} ##########`);
  for (const [label, text] of rows) {
    const leg = k => { const L = P(keys[k]); for (const re of L) { if (re.test(text)) return re.source.slice(0, 44); } return null; };
    const ext = leg('low') || leg('high');
    const reg = leg('up') || leg('down');
    const iv = leg('iv'); const cr = leg('cr'); const ef = leg('ef');
    const exm = ['mzh', 'evzh', 'nzh', 'hzh'].map(k => `${k}=${leg(k) ? 'HIT' : '-'}`).join(' ');
    console.log(`[${label}]\n  EXT=${ext ? 'Y' : '✗NONE'} (${ext})\n  REG=${reg ? 'Y' : '✗NONE'} (${reg})\n  IV=${iv ? 'Y' : '✗NONE'} (${iv})\n  ATTR credit=${cr ? 'Y' : '✗'} effect=${ef ? 'Y' : '✗'} (${cr || ef})\n  ${exm}`);
  }
}
report('ZH', ZH);
report('EN', EN);
