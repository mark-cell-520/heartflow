'use strict';
// [r298 探针] c5 良性误伤定位：局部否定 vs 整体作废的界线
const { checkAdHominem, __internals } = require('../../src/ad-hominem.js');
const { gate } = require('../../src/gate.js');

const I = __internals();

const CASES = [
  // 良性：局部否定（有 but/however/overall 转折或 on point N 局部限定）
  ['Your analysis is wrong on point three, but the overall approach is sound.', '局部否定 but'],
  ['Your analysis is wrong in one respect, though the conclusion holds.', 'in one respect'],
  ['Your analysis is wrong on the second point, but the rest is fine.', 'on the second point'],
  ['Your reasoning is flawed in one step, but the argument is valid.', 'flawed in one step'],
  ['His reasoning is wrong here, but right about the rest.', 'here 局部'],
  // 攻击：整体作废（无局部限定，且带 disregard 腿）
  ['Their assessment of our process is invalid, so we can ignore it.', '整体作废'],
  ['His reasoning is fundamentally flawed, so his conclusion is worthless.', '整体作废'],
  ['Your analysis is garbage and should be thrown out.', '整体作废 garbage'],
];

for (const [text, label] of CASES) {
  const att = I.ATTACK_EN.test(text);
  const dis = I.DISREGARD_EN.test(text);
  const hit = checkAdHominem(text).hit;
  console.log(`[${label}] attack=${att} disregard=${dis} hit=${hit}`);
  if (hit) {
    const g = gate(text);
    console.log('    gate=' + g.gate.action + ' dims=' + (g.findings||[]).map(f=>f.dimension).join(','));
  }
}
