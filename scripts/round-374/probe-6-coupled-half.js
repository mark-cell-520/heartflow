// scripts/round-374/probe-6-coupled-half.js
// 检查 sunk_cost / norm_desensitize 的 up 正则英文半族是否真的命中。
// （probe-3 里这两个 fam count=0 是因为它们需要 predatory 层在场才激活，
//  探针样本本身没有索取层——这里直调 up 单测半边。）
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));
const { EN_ATTACK, EN_BENIGN } = require('./samples.js');

const LADDERS = mtt.LADDERS;
const sunk = LADDERS.find(l => l.name === 'sunk_cost');
const norm = LADDERS.find(l => l.name === 'norm_desensitize');
const normHalf = mtt._RE_NORM_DESENSITIZE;

function sc(re, hits, misses, label) {
  const h = hits.filter(s => re.test(s)).length;
  const m = misses.filter(s => re.test(s)).length;
  console.log(`${label}: 阳性 ${h}/${hits.length}  良性误伤 ${m}/${misses.length}`);
}
const allBen = Object.values(EN_BENIGN).flat();

sc(sunk.up, EN_ATTACK.sunk_cost, allBen, 'sunk_cost.up');
sc(normHalf, EN_ATTACK.norm_desensitize, allBen, 'norm_desensitize up');

console.log('---MISS---');
EN_ATTACK.sunk_cost.forEach((s, i) => { if (!sunk.up.test(s)) console.log(`sunk_cost miss [${i}]`); });
EN_ATTACK.norm_desensitize.forEach((s, i) => { if (!normHalf.test(s)) console.log(`norm miss [${i}]`); });
console.log('norm is RegExp:', normHalf instanceof RegExp, 'source len', normHalf.source.length);
