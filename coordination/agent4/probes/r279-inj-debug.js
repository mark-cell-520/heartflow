// r279 调试：注入删条后仍命中的句子，逐腿查残留匹配
const brnMod = require('/data/home/heartflow/src/base-rate-neglect.js');
const crcMod = require('/data/home/heartflow/src/count-rate-conflation.js');
const lsnMod = require('/data/home/heartflow/src/law-of-small-numbers.js');
const B = brnMod.__internals(), C = crcMod.__internals(), L = lsnMod.__internals();
const dropLeg = (arr, needle) => arr.filter(re => !re.source.includes(needle));

const cases = [
  ['brn 信用分', brnMod.checkBaseRateNeglect, B, { SIGNAL_ZH: dropLeg(B.SIGNAL_ZH, '芝麻分') }, '信用分被降到 300，基本可以判定你是老赖。'],
  ['crc 电诈报案', crcMod.detectCountRateConflation, C, { COUNT_ZH: dropLeg(C.COUNT_ZH, '报案|立案') }, '我市电诈报案数是邻市的三倍，这里治安更差。'],
  ['crc 报警数', crcMod.detectCountRateConflation, C, { COUNT_ZH: dropLeg(C.COUNT_ZH, '报案|立案') }, '我市报警数是邻省的两倍，这里明显更不安全。'],
  ['lsn 三把', lsnMod.detectLawOfSmallNumbers, L, { SMALL_N_ZH: dropLeg(L.SMALL_N_ZH, '氪|连') }, '我连玩了三把都输了，这号是废的。'],
  ['lsn 三单', lsnMod.detectLawOfSmallNumbers, L, { SMALL_N_ZH: dropLeg(L.SMALL_N_ZH, '氪|连') }, '氪了三单就出货，这游戏不坑钱。'],
  ['lsn 两场', lsnMod.detectLawOfSmallNumbers, L, { SMALL_N_ZH: dropLeg(L.SMALL_N_ZH, '三连胜') }, '看了两场直播，这主播翻车是早晚的事。'],
  ['lsn 翻车', lsnMod.detectLawOfSmallNumbers, L, { UNIVERSAL_ZH: dropLeg(L.UNIVERSAL_ZH, '暴雷|崩盘') }, '看了两场直播，这主播翻车是早晚的事。'],
  ['lsn 真相', lsnMod.detectLawOfSmallNumbers, L, { EXEMPT_ZH: dropLeg(L.EXEMPT_ZH, '全貌|本质') }, '小样本才是真相，大样本都是被平均出来的。'],
  ['lsn 越不准', lsnMod.detectLawOfSmallNumbers, L, { EXEMPT_ZH: dropLeg(L.EXEMPT_ZH, '稀释') }, '样本越大越不准，数据一多就失真。'],
  ['lsn 就行', lsnMod.detectLawOfSmallNumbers, L, { EXEMPT_ZH: dropLeg(L.EXEMPT_ZH, '形式主义') }, '问卷问几个人就行，调查那么多都是走形式。'],
  ['lsn EN trend', lsnMod.detectLawOfSmallNumbers, L, { EXEMPT_EN: dropLeg(L.EXEMPT_EN, 'trend') }, 'Three data points and the trend is obvious, no need for a bigger dataset.'],
  ['lsn EN truth', lsnMod.detectLawOfSmallNumbers, L, { EXEMPT_EN: dropLeg(L.EXEMPT_EN, 'truth|reality') }, 'Small samples tell the truth; big datasets average everything away.'],
];

for (const [label, fn, internals, inj, text] of cases) {
  const r = fn(text, inj);
  console.log('\n== ' + label + ' | ' + text.slice(0, 30) + ' | hit=' + r.hit);
  if (!r.hit) continue;
  // 注入后哪些常量仍匹配
  for (const [key, arr] of Object.entries(internals)) {
    if (!Array.isArray(arr) || !arr.length || !(arr[0] instanceof RegExp)) continue;
    const injected = inj[key];
    const list = injected || arr;
    for (const re of list) {
      if (re.test(text)) console.log('   残留: ' + key + ' ← ' + re.source.slice(0, 70));
    }
  }
}
