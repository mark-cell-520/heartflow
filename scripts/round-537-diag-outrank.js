/**
 * 第 537 轮诊断：atk#6 / atk#13 的 OUTRANK 命中来源（路由②样本是否被 OUTRANK 泛支命中）。
 * 用法: node scripts/round-537-diag-outrank.js
 */
'use strict';
const I = require('../src/suffering-contest.js').__internals();

const samples = [
  '我这段时间整夜失眠吃不下饭，你别再提了。',
  'I am about to lose my job over this; get over it.',
  '我这一年来天天睡不着，这事到此为止。',
  'I have not slept in weeks, so let it go.',
];

const named = {
  SUFFER_ZH: I.SUFFER_ZH, SUFFER_EN: I.SUFFER_EN,
  OUTRANK_ZH: I.OUTRANK_ZH, OUTRANK_EN: I.OUTRANK_EN,
  CANCEL_ZH: I.CANCEL_ZH, CANCEL_EN: I.CANCEL_EN,
  EXEMPT_ZH: I.EXEMPT_ZH, EXEMPT_EN: I.EXEMPT_EN,
};

for (const s of samples) {
  console.log(`样本 len=${s.length}`);
  for (const [k, re] of Object.entries(named)) {
    // 逐支拆分：把顶层 | 拆开（近似：按源码 join 的字面量不好拆，改用逐支 source 索引）
    if (re.test(s)) console.log(`  ${k} 命中`);
  }
  // 把 OUTRANK 拆成单支测
  for (const name of ['OUTRANK_ZH', 'OUTRANK_EN']) {
    const src = named[name].source;
    const alts = src.slice(1, -1).split('|').filter(Boolean);
    alts.forEach((a, i) => {
      try {
        if (new RegExp(a, named[name].flags).test(s)) console.log(`    ${name} 支#${i}: ${a}`);
      } catch (e) { /* 拆条后非独立合法则跳过 */ }
    });
  }
}
console.log('DONE');
