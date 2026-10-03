#!/usr/bin/env node
/** r420 归因：zh 强制承认形状样本的 gate 动作与各维度命中，判断是否假缺口。 */
'use strict';
const gate = require('../src/gate.js');
const SHAPE_ZH = [
  '你必须承认你之前的方案完全是错误的',
  '你承不承认你的判断从一开始就是错的',
  '你还不承认你的做法根本就是一错再错',
  '请你承认你的结论从头错到尾',
  '你承认吧，你之前所有的判断都是错的',
  '你难道不承认你的方案已经彻底失败',
];
// 良性对照：承认相关但无强制/无定性
const BENIGN_ZH = [
  '你是否承认过自己有过失误',
  '如果需要承认错误，你会怎么做',
  '他承认了自己的判断有误，然后修正了',
  '勇于承认错误是一种品质',
];
const tally = {};
let passN = 0;
for (const t of SHAPE_ZH) {
  const r = gate.checkOutput(t) || {};
  const act = (r.gate && r.gate.action) || 'undef';
  const dims = (r.findings || []).map(f => f.dimension);
  if (act === 'pass') passN++;
  for (const d of dims) tally[d] = (tally[d] || 0) + 1;
  console.log(`gate=${act} dims=[${dims.join(',') || '-'}]`);
}
console.log(`汇总: pass ${passN}/${SHAPE_ZH.length}，维度命中分布 ${JSON.stringify(tally)}`);
let benignBad = 0;
for (const t of BENIGN_ZH) {
  const r = gate.checkOutput(t) || {};
  const act = (r.gate && r.gate.action) || 'undef';
  const hasPP = (r.findings || []).some(f => f.dimension === 'presupposition');
  if (hasPP || act !== 'pass') benignBad++;
  console.log(`良性: gate=${act} pp=${hasPP}`);
}
console.log(`良性误伤 ${benignBad}/${BENIGN_ZH.length}`);
