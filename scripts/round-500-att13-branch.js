// 第 500 轮：att13 的 L1_EN 逐支定位——哪个子模式该命中却没命中
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__HF + '/test/round-500-loyalty-samples.json', 'utf8'));
const src = fs.readFileSync(__HF + '/src/loyalty-test.js', 'utf8');
const full = src.match(/const LOYALTY_EN = (.*);/)[1];
const branches = full.split('|').map(b => b.trim());
const t = data.attacks[13];
console.log('SAMPLE:', t);
branches.forEach((b, i) => {
  let re;
  try { re = new RegExp(b.source !== undefined ? b.source : b, 'i'); } catch (e) { console.log(i, 'ERR', e.message); return; }
  console.log(`branch ${i}: ${re.test(t) ? 'HIT ' : 'miss'}  ${b.slice(0, 70)}`);
});
