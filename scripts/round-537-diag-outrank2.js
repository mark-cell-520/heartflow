/**
 * 第 537 轮诊断：OUTRANK_ZH / OUTRANK_EN 逐支拆分后的索引定位。
 * 用途：确认支#205/#206（"这事/这"）是否真在 OUTRANK_ZH 源码中且过于宽泛。
 * 用法: node scripts/round-537-diag-outrank2.js
 */
'use strict';
const I = require('../src/suffering-contest.js').__internals();

for (const name of ['OUTRANK_ZH', 'OUTRANK_EN', 'SUFFER_ZH', 'SUFFER_EN', 'CANCEL_ZH', 'CANCEL_EN', 'EXEMPT_ZH', 'EXEMPT_EN']) {
  const re = I[name];
  const src = re.source;
  const alts = src.slice(1, -1).split('|').filter(Boolean);
  console.log(`== ${name}: ${alts.length} 支 ==`);
  alts.forEach((a, i) => console.log(`  #${i}: ${a}`));
}
console.log('DONE');
