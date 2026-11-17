'use strict';
// r379 边界实测：flat_rate_bias 与 sunk_cost_coercion / mental_accounting /
// present_bias / opportunity_cost_neglect 的射程交集双向固化。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { detectFlatRateBias } = require(path.join(ROOT, 'src', 'flat-rate-bias.js'));

// 既有族攻击句（我族必须零命中——不越界抢存量射程）
const SINK = [
  '会员费都交了两年了，现在退出太可惜，只能继续办下去。',
  '机票都买了，再难受也得飞完，不然就浪费了。',
  '这部电影票买了就不能退，再难看也得坐完全场。',
  '游戏氪了三千块，不玩到关服就等于白花钱。',
  '这个项目投了这么多人力，现在放弃就前功尽弃了。',
  '钱都花了，这东西再难吃也得吃完，不然就亏了。',
];
// 我族攻击句（存量维度归因测量）
const MINE = [
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
// mental accounting / present bias / opportunity-cost 攻击句（我族必须零命中）
const OTHER = [
  '年终奖是意外之财，花起来不心疼，可以随便买点奢侈品。',
  '工资存在卡里不动，年终奖单独拿去做短线，这样最合理。',
  '这个会员一天才三块钱，少喝半杯奶茶就省出来了，不买白不买。',
  '视频网站会员一个月才十几块，平摊到每天几乎不要钱，先充一年再说。',
  '免费试用的工具先注册，反正不要钱，用不用得着以后再说。',
  '直播说是免费领的，其实时间成本比花钱还贵，只是没人算这笔账。',
];

let bad = 0;
console.log('=== 存量族攻击句 → 我族必须零命中 ===');
for (const [i, t] of SINK.concat(OTHER).entries()) {
  const r = detectFlatRateBias(t);
  if (r.hit) { bad++; console.log('  ✗ [' + i + '] 误命中: ' + t.slice(0, 30) + ' → ' + r.details); }
  else console.log('  ✓ [' + i + '] 零命中: ' + t.slice(0, 26) + '…');
}
console.log('=== 我族攻击句 → 存量维度归因（econ 族级）===');
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
for (const [i, t] of MINE.entries()) {
  const r = gcheck(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const act = r.gate ? r.gate.action : r.action;
  const pa = plugin.analyze(t);
  const fams = pa.families.map(x => x.key);
  const econDims = dims.filter(d => d === 'econ_reasoning_gate');
  const onlyMine = fams.length === 1 && fams[0] === 'flat_rate_bias';
  const okRow = econDims.length === 1 && onlyMine && act !== 'pass';
  if (!okRow) bad++;
  console.log((okRow ? '  ✓ ' : '  ✗ ') + '[' + (i + 1) + '] action=' + act + ' econ族=' + JSON.stringify(fams)
    + (dims.length > 1 ? ' 存量共现=' + dims.filter(d => d !== 'econ_reasoning_gate').join(',') : ''));
}
console.log(bad === 0 ? '\n边界零越界 + 归因纯净（全部仅 flat_rate_bias 承载）' : '\n问题 ' + bad + ' 条');
process.exit(bad > 0 ? 1 : 0);
