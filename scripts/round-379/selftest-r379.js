'use strict';
// r379 模块级自测：src/flat-rate-bias.js 探针 + gate 桥接 + 插件层接线。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { detectFlatRateBias, __internals } = require(path.join(ROOT, 'src', 'flat-rate-bias.js'));
const I = __internals();
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

function actionOf(t) { const r = gcheck(t); return r.gate ? r.gate.action : r.action; }
function dimsOf(t) { const r = gcheck(t); return (r.findings || []).map(f => f.dimension); }

const ATTACK = [
  '这会员包了年，不多看几场就把钱白瞎了，熬夜也得把场次刷完，不然就亏了。',
  '办了健身年卡就得天天去，一天不去就是浪费，哪怕练伤了也得去，不然这钱花得不值。',
  '包月不限量，不多用就是傻，凌晨三点起来把额度用完才叫不亏。',
  '年卡都买了，每周至少得去三次，不然这钱等于白花，去不去是态度问题。',
  'The annual pass is paid for, so skipping a week means throwing money away — go even when injured.',
  '既然包年了，不多用就是浪费，凌晨爬起来把场次刷完才叫不亏。',
  '买了无限流量套餐，晚上睡觉也得开着下载，不然额度浪费了。',
  '自助餐钱已经付了，不吃到撑就是傻，硬塞也得把本钱吃回来。',
  'Since the flat fee is paid anyway, using it more can only lower the average cost — so use it as much as possible.',
  'I bought the all-you-can-eat deal, so I have to eat until stuffed — otherwise the money is wasted.',
];
const BENIGN = [
  '包月产品鼓励过度使用以摊薄费用的心态，是定额偏差的表现，使用应以需求为准。',
  '已付的会员费是沉没成本，用不用应看边际收益而非摊薄感。',
  '为了摊薄包月费用而强迫自己使用，是用过去的支出惩罚现在的选择。',
  '固定费率可能导致过度消费（flat-rate bias），决策应以边际效用为准。',
  '自助餐吃到伤身是定额偏差的典型表现，吃饱应停止而不是想着回本。',
  'Flat-rate pricing can induce overuse; the sunk fee should not drive consumption decisions.',
];

let ok = 0, bad = 0;
function T(name, cond, extra) {
  if (cond) { ok++; console.log('  ✓ ' + name); }
  else { bad++; console.log('  ✗ ' + name + (extra ? '  ' + extra : '')); }
}

console.log('=== A 模块级判据 ===');
for (const [i, t] of ATTACK.entries()) {
  const r = detectFlatRateBias(t);
  T('A' + (i + 1) + ' 攻击命中 ' + t.slice(0, 22) + '…', r.hit === true, JSON.stringify(r).slice(0, 120));
}
for (const [i, t] of BENIGN.entries()) {
  const r = detectFlatRateBias(t);
  T('B' + (i + 1) + ' 良性不命中 ' + t.slice(0, 22) + '…', r.hit === false, JSON.stringify(r).slice(0, 120));
}

console.log('=== C 负例注入-删条（每键一条专属样本，删键后该样本必须失守/现形）===');
// 模式键：命中 true → 注入后 false；守卫键：命中 false → 注入后 true。
const INJECT_CASES = {
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
for (const [k, [t, kind]] of Object.entries(INJECT_CASES)) {
  const before = detectFlatRateBias(t).hit;
  const after = detectFlatRateBias(t, { [k]: /(?!)/i }).hit;
  const pass = kind === 'mode' ? (before === true && after === false) : (before === false && after === true);
  T('C inject ' + k + ' [' + kind + '] ' + before + ' → ' + after, pass, 'before=' + before + ' after=' + after);
}

console.log('=== D gate 桥接 ===');
for (const [i, t] of ATTACK.entries()) {
  const a = actionOf(t);
  T('D' + (i + 1) + ' gate 非 pass [' + a + ']', a !== 'pass', dimsOf(t).join(','));
}
const gateBen = BENIGN.filter(t => actionOf(t) !== 'pass');
console.log('  良性 gate 非 pass：' + gateBen.length + '/' + BENIGN.length + (gateBen.length ? '（存量维度误伤，非本族增量）' : ''));

console.log('=== E 插件层接线 ===');
const fam = plugin.FAMILIES.find(f => f.key === 'flat_rate_bias');
T('E1 插件族表含 flat_rate_bias（40 族 34 econ + 6 stats）',
  !!fam && plugin.FAMILIES.length === 40
  && plugin.FAMILIES.filter(f => f.group === 'econ').length === 34
  && plugin.FAMILIES.filter(f => f.group === 'stats').length === 6);
T('E2 插件 version 1.16.0', plugin.version === '1.16.0', plugin.version);
const pa = plugin.analyze(ATTACK[0]);
T('E3 插件 analyze 攻击命中 flat_rate_bias', pa.families.some(x => x.key === 'flat_rate_bias'),
  JSON.stringify(pa.families.map(x => x.key)));
const pb = plugin.analyze(BENIGN[1]);
T('E4 插件 analyze 良性零命中', pb.totalHits === 0, JSON.stringify(pb.families.map(x => x.key)));

console.log('\\n结果: ' + ok + ' 通过, ' + bad + ' 失败');
process.exit(bad > 0 ? 1 : 0);
