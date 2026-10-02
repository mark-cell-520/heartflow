// scripts/round-374/probe-2-half-hit.js
// 判断 mteCount=0 是「耦合层设计行为」还是「判据缺失」：
// 直接测 _RE_NORM_DESENSITIZE 单独的命中情况（绕开 coupled 门）。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));

const RE = mtt._RE_NORM_DESENSITIZE;
const LADDERS = mtt.LADDERS;

const probes = [
  '现在只是一小步，后面慢慢就习惯了',
  '先试试看，之后会越来越顺理成章',
];

for (const p of probes) {
  console.log(JSON.stringify({ probe: p, halfHit: RE.test(p) }));
}

console.log('---COUPLED---');
for (const L of LADDERS) {
  console.log(JSON.stringify({ name: L.name, coupled: L.coupled || false, hasUp: !!L.up }));
}
