'use strict';
// r516 诊断4：样本集 attacks 数组的真实索引 vs 测试里 R3(i) 的映射
// 怀疑「守卫样本索引」与「层位诊断索引」错位。
const samples = require('../test/round-511-scrutiny-evasion-samples.json');
const mod = require('../src/scrutiny-evasion.js');
console.log('attacks 总数:', samples.attacks.length);
for (let i = 15; i <= 27; i++) {
  const s = samples.attacks[i];
  if (!s) continue;
  const r = mod.checkScrutinyEvasion(s);
  console.log(`  atk#${i} hit=${r.hit} score=${r.score} ${r.detail} :: ${s}`);
}
