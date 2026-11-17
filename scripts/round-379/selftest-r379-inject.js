'use strict';
// r379 负例注入-删条样本设计验证：每个键一条专属样本（删该键后样本必须失守）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectFlatRateBias } = require(path.join(ROOT, 'src', 'flat-rate-bias.js'));

// 每键：专属样本 + 期望语义。
//   模式键（腿组）：命中 true → 注入后 false（删条后攻击失守）
//   守卫键（豁免/否定/对冲）：命中 false → 注入后 true（删守卫后攻击形现形）
const CASES = {
  FLAT_ZH:       ['这会员包了年，不多看几场就把钱白瞎了，熬夜也得把场次刷完。', 'mode'],
  FLAT_EN:       ['The annual pass is paid for, so skipping a week means throwing money away.', 'mode'],
  UNDERUSE_ZH:   ['会员包了月，这个月不多用就是亏。', 'mode'],
  UNDERUSE_EN:   ['The membership is monthly, and not using it is just a waste.', 'mode'],
  WASTE_ZH:      ['年卡办了，一天不去就是浪费。', 'mode'],
  WASTE_EN:      ['The annual card is paid, and not going is a waste.', 'mode'],
  MUSTFREQ_ZH:   ['健身年卡办了就得天天去，风雨无阻。', 'mode'],
  MUSTFREQ_EN:   ['The yearly pass is paid for, so I have to use it every single day.', 'mode'],
  DILUTE_ZH:     ['包年就是好，用得越多，平均成本越低，当然要放开用。', 'mode'],
  DILUTE_EN:     ['With the flat fee paid, the more you use it, the cheaper each visit gets.', 'mode'],
  CONCEPT_ZH:    ['定额偏差指包了年卡的用户觉得不多用就是浪费的现象。', 'guard'],
  CONCEPT_EN:    ['Flat-rate bias: with an annual membership, people feel not using it is a waste.', 'guard'],
  CORRECT_ZH:    ['已付的会员费是沉没成本，用不用应看边际收益，而不是不多用就是浪费。', 'guard'],
  CORRECT_EN:    ['The annual fee is sunk — use it only if the marginal benefit is there, not because not going is a waste.', 'guard'],
  NEG_ZH:        ['健身卡办了，但没人说就得天天去，不想去就不去。', 'guard'],
  NEG_EN:        ['The yearly pass is paid for, but you do not have to use it every single day.', 'guard'],
  HEDGE_ZH:      ['包了年卡，不多用就是浪费，这是经典的误解，别真这么干。', 'guard'],
  HEDGE_EN:      ['With the annual card paid, not using it is a waste — that is the classic misconception.', 'guard'],
};

let ok = 0, bad = 0;
for (const [k, [t, kind]] of Object.entries(CASES)) {
  const before = detectFlatRateBias(t).hit;
  const after = detectFlatRateBias(t, { [k]: /(?!)/i }).hit;
  const pass = kind === 'mode' ? (before === true && after === false) : (before === false && after === true);
  if (pass) ok++; else bad++;
  console.log((pass ? '  ✓ ' : '  ✗ ') + k.padEnd(14) + ' [' + kind + '] 命中 ' + before + ' → 注入后 ' + after);
}
console.log('\n结果: ' + ok + ' 通过, ' + bad + ' 失败');
process.exit(bad > 0 ? 1 : 0);
