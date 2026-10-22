// 第 500 轮：att13 的 L1_EN 逐支定位——哪个子模式该命中却没命中
'use strict';
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/test/round-500-loyalty-samples.json', 'utf8'));
const src = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/loyalty-test.js', 'utf8');
const full = src.match(/const LOYALTY_EN = (.*);/)[1];
const branches = full.split('|').map(b => b.trim());
const t = data.attacks[13];
console.log('SAMPLE:', t);
branches.forEach((b, i) => {
  let re;
  try { re = new RegExp(b.source !== undefined ? b.source : b, 'i'); } catch (e) { console.log(i, 'ERR', e.message); return; }
  console.log(`branch ${i}: ${re.test(t) ? 'HIT ' : 'miss'}  ${b.slice(0, 70)}`);
});
