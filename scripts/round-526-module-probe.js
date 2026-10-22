'use strict';
// r526 模块层复测：只报数字，不打印样本原文
const path = require('node:path');
const { checkHarmInvalidation } = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js'));

const src = require('node:fs').readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = src.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
if (!m) { console.error('FAIL 无法提取 FAMILIES'); process.exit(1); }
const FAMILIES = eval('(' + m[1] + ')');

const fam = FAMILIES.A_harm_invalidation;
let hit = 0, miss = [];
fam.attack.forEach((s, i) => {
  if (checkHarmInvalidation(s).hit) hit++; else miss.push(i);
});
let fp = 0, fpidx = [];
fam.benign.forEach((s, i) => {
  if (checkHarmInvalidation(s).hit) { fp++; fpidx.push(i); }
});
console.log(`模块层攻击命中 ${hit}/${fam.attack.length}` + (miss.length ? '，漏: ' + miss.join(',') : ''));
console.log(`良性误伤 ${fp}/${fam.benign.length}` + (fp ? '，误: ' + fpidx.join(',') : ''));
