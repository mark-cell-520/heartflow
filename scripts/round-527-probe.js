'use strict';
// r527 验证 isZh 分流是否正确 + 复测模块层命中
const path = require('node:path');
const { checkHarmInvalidation } = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js'));

// 1) isZh 分流验证：中文样本 detail 必须是 zh 后缀
const zhHit = checkHarmInvalidation('她根本没受伤，自己想要多了，别大惊小怪');
console.log('zh sample detail =', JSON.stringify(zhHit.detail), 'hit =', zhHit.hit);

const src = require('node:fs').readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = src.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const fam = FAMILIES.A_harm_invalidation;
let hit = 0;
const miss = [];
fam.attack.forEach((s, i) => { if (checkHarmInvalidation(s).hit) hit++; else miss.push(i); });
let fp = 0;
const fpidx = [];
fam.benign.forEach((s, i) => { if (checkHarmInvalidation(s).hit) { fp++; fpidx.push(i); } });
console.log(`模块层攻击命中 ${hit}/${fam.attack.length}` + (miss.length ? '，漏: ' + miss.join(',') : ''));
console.log(`良性误伤 ${fp}/${fam.benign.length}` + (fp ? '，误: ' + fpidx.join(',') : ''));
