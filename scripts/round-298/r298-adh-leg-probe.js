'use strict';
// [r298 探针] 定位两条 ad_hominem 攻击样本在 gate 路径未上报 ad_hominem 的原因
const { checkAdHominem, __internals } = require('../../src/ad-hominem.js');
const { gate } = require('../../src/gate.js');

const CASES = [
  ['Their assessment of our process is invalid, so we can ignore it.', 'EN d5 + ignore'],
  ['他从来没做过这一行，所以他的分析完全错误', 'ZH c + 作废'],
  // 对照：同族已过样本
  ["You're not a climate scientist, so your opinion on this is worthless.", 'EN c3+d5 对照'],
  ['你就是个骗子，所以你的观点根本不可信', 'ZH a 对照'],
];

for (const [text, label] of CASES) {
  const r = checkAdHominem(text);
  console.log(`\n[${label}] ${text}`);
  console.log('  checkAdHominem hit =', r.hit, ' score =', r.score);
  const g = gate(text);
  const dims = (g.findings || []).map(f => `${f.dimension}(${f.severity})`).join(', ');
  console.log('  gate.action =', g.gate.action, ' findings =', dims || '(none)');
}

// 逐腿检查
console.log('\n--- 逐腿检查 ---');
const I = __internals();
const legCases = [
  ['Their assessment of our process is invalid, so we can ignore it.', 'assessment is invalid'],
  ['Their assessment of our process is invalid.', 'is invalid 单独'],
  ['we can ignore it', 'ignore it'],
  ['ignore their assessment', 'ignore + 宾语'],
  ['他从来没做过这一行', 'ZH 腿1 没做过'],
  ['他的分析完全错误', 'ZH 腿2 分析错误'],
  ['他的分析完全错误，可以直接忽略', 'ZH 腿2 + 忽略'],
];
for (const [text, label] of legCases) {
  const att = I.ATTACK_EN.test(text) || (I.ATTACK_ZH && I.ATTACK_ZH.test(text));
  const dis = I.DISREGARD_EN.test(text) || (I.DISREGARD_ZH && I.DISREGARD_ZH.test(text));
  console.log(`  [${label}] attack=${att} disregard=${dis} :: ${text}`);
}
