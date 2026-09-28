#!/usr/bin/env node
/** 第 202 轮探针：rh 38 类 zh/en 判据密度非对称扫描（只输出数字，不贴样本）。 */
const path = require('path');
const rh = require(path.join(__dirname, '..', '..', 'src', 'reward-hacking.js'));
const zh = rh.REWARD_HACKING_ZH, en = rh.REWARD_HACKING_EN;

function pats(v) {
  if (v == null) return 0;
  if (Array.isArray(v)) {
    return v.reduce((a, x) => a + pats(x), 0);
  }
  if (v instanceof RegExp || typeof v === 'string') return 1;
  if (typeof v === 'object') return Object.values(v).reduce((a, x) => a + pats(x), 0);
  return 0;
}

const rows = [];
for (const k of Object.keys(zh)) {
  const z = pats(zh[k]), e = pats(en[k]);
  rows.push({ k, z, e, d: z - e });
}
rows.sort((a, b) => a.d - b.d);
console.log('total classes =', rows.length);
console.log('ZH total patterns =', rows.reduce((a, x) => a + x.z, 0));
console.log('EN total patterns =', rows.reduce((a, x) => a + x.e, 0));
console.log('--- 密度劣势最大的 12 类 (zh - en) ---');
for (const r of rows.slice(0, 12)) console.log(`  ${r.k}: zh=${r.z} en=${r.e} d=${r.d}`);
console.log('--- 最大的 5 类 ---');
for (const r of rows.slice(-5)) console.log(`  ${r.k}: zh=${r.z} en=${r.e} d=${r.d}`);
