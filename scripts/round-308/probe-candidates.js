// r308 定夺探针：14 个未接线 provisional 维度模块
// 对每个模块：取其测试文件的攻击样本 → 模块层自命中验证 → gate() 全 findings 穿透实测
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const CANDIDATES = [
  { dim: 'anchoring_effect',           file: 'anchoring-effect.js',           fn: 'detectAnchoringEffect' },
  { dim: 'disposition_effect',         file: 'disposition-effect.js',         fn: 'detectDispositionEffect' },
  { dim: 'effort_justification',       file: 'effort-justification.js',       fn: 'detectEffortJustification' },
  { dim: 'endowment_effect',           file: 'endowment-effect.js',           fn: 'detectEndowmentEffect' },
  { dim: 'illusion_of_control',        file: 'illusion-of-control.js',        fn: 'detectIllusionOfControl' },
  { dim: 'inverse_gamblers_fallacy',   file: 'inverse-gamblers-fallacy.js',   fn: 'detectInverseGamblersFallacy' },
  { dim: 'mental_accounting',          file: 'mental-accounting.js',          fn: 'detectMentalAccounting' },
  { dim: 'p_hacking',                  file: 'p-hacking.js',                  fn: 'detectPHacking' },
  { dim: 'perverse_incentive',         file: 'perverse-incentive.js',         fn: 'detectPerverseIncentive' },
  { dim: 'significance_effect_size',   file: 'significance-effect-size.js',   fn: 'detectSignificanceEffectSize' },
  { dim: 'tragedy_of_commons',         file: 'tragedy-of-commons.js',         fn: 'detectTragedyOfCommons' },
  { dim: 'winners_curse',              file: 'winners-curse.js',              fn: 'detectWinnersCurse' },
  { dim: 'average_marginal_conflation',file: 'average-marginal-conflation.js',fn: 'checkAverageMarginalConflation' },
  { dim: 'budget_value_conflation',    file: 'budget-value-conflation.js',    fn: 'checkBudgetValueConflation' },
];

// 攻击样本：手工取各模块核心攻击形（中 EN 混合）
const ATTACKS = {
  anchoring_effect: [
    '这套房标价五百万，房东降了二十万就催着我定，我觉得占了便宜。',
    '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。',
    '起拍价一万二，最后两万八落锤，我现在觉得这瓷瓶也就值这个价。',
    'The list price was three hundred, and the fifty percent discount made the purchase feel like a win regardless of quality.',
    'The first price I heard was two hundred, and every offer after that stayed inside the orbit of that number.',
  ],
  disposition_effect: [
    '股票涨了一点我就急着卖，跌了却死拿着不放，就盼着回本。',
    '赚钱的基金拿不住，亏钱的基金越跌越加仓，总想着等回本再卖。',
    'I sell winners too early but hold losers far too long hoping they will come back.',
  ],
  effort_justification: [
    '这桌菜我熬了整整三个通宵才做出来，所以它一定是美味佳肴。',
    '我花了两年时间写这本书，既然投入这么多精力，它肯定值得一读。',
    'I assembled the furniture myself after six hours, so it must be better than the store-bought one.',
  ],
  endowment_effect: [
    '这个马克杯是我的，所以它对我而言值更多钱，换别人的我最多出五块。',
    '因为是自己的公司，我怎么看都觉得它比竞争对手更有价值。',
    'This mug is mine, so I would never sell it for less than twenty, though I would never pay that for it.',
  ],
  illusion_of_control: [
    '我每次买彩票都用自己的幸运数字，这样中奖的概率肯定更高。',
    '摇号之前我先拜一拜，再默念三遍我的号码，感觉中签几率大了不少。',
    'I always use my lucky numbers in the lottery, so my odds of winning are much better.',
  ],
  inverse_gamblers_fallacy: [
    '这台老虎机已经连着出了五次大奖，下一个玩家中奖的概率一定很高。',
    '前面十个人都没抽中，所以接下来这个人抽中的机会更大了。',
    'The slot machine has paid out five times in a row, so the next player is very likely to win.',
  ],
  mental_accounting: [
    '这笔钱是年终奖发的，花起来不心疼，跟工资不是一个概念。',
    '炒股赚来的钱我拿它去挥霍，辛苦上班挣的钱我可舍不得这么花。',
    'Money from the bonus feels free to spend, unlike the salary I work so hard for.',
  ],
  p_hacking: [
    '我们试了二十种分组方式，终于找到一种 p 值小于 0.05 的结果，可以发表了。',
    '这个数据集我跑了上百次回归，直到有个变量显著为止。',
    'We tried a dozen different subgroup analyses until we found one with p < 0.05.',
  ],
  perverse_incentive: [
    '公司按抓到的老鼠数量发奖金，结果员工干脆养老鼠再抓来领赏。',
    '按代码行数计绩效的程序员，把一行拆成十行来写。',
    'The bounty on cobras led people to breed cobras to collect the reward.',
  ],
  significance_effect_size: [
    '这个结果统计显著（p<0.05），说明效应一定很重要，值得全行业推广。',
    'p 值小于 0.01，所以这个发现显然有重大的实际意义。',
    'The result is statistically significant, so the effect must be practically important.',
  ],
  tragedy_of_commons: [
    '这片公共草场每家都尽量多养羊，最后草场退化，谁也吃不上一口。',
    '渔民们都加大捕捞量，公海渔业资源几年就被捞空了。',
    'Every herder adds more sheep to the commons until the pasture is destroyed.',
  ],
  winners_curse: [
    '拍卖赢家往往是出价最高的那个人，很可能就是高估了标的物价值的人。',
    '招标中标价总是偏低，中标方十有八九是要亏钱的。',
    'The winner of an auction is usually the one who most overestimated the value.',
  ],
  average_marginal_conflation: [
    '去年每台设备平均利润五万，所以再增产十台就能多赚五十万。',
    '公司人均产出二十万，说明再招一百人就能增加两千万营收。',
    'Average profit per unit is five thousand, so selling ten more units adds fifty thousand.',
  ],
  budget_value_conflation: [
    '我买不起这个包，所以它根本没什么价值。',
    '连这个都吃不起，说明这餐厅本身就是垃圾。',
    'I cannot afford it, so it cannot be worth anything.',
  ],
};

const rows = [];
for (const c of CANDIDATES) {
  let mod;
  try { mod = require(path.join(ROOT, 'src', c.file)); } catch (e) { rows.push({ ...c, err: 'LOAD:' + e.message.slice(0, 40) }); continue; }
  const f = mod[c.fn];
  if (typeof f !== 'function') { rows.push({ ...c, err: 'NO_FN' }); continue; }
  const samples = ATTACKS[c.dim] || [];
  let modHit = 0, gateHit = 0, gatePass = 0;
  const carried = new Set();
  for (const t of samples) {
    let m;
    try { m = f(t); } catch (e) { m = { hit: false, err: e.message }; }
    const mHit = m && m.hit === true;
    if (mHit) modHit++;
    let g;
    try { g = gate.checkOutput(t); } catch (e) { g = { gate: { action: 'ERR' }, findings: [] }; }
    const dims = (g.findings || []).map(x => x.dimension);
    if (dims.includes(c.dim)) gateHit++;
    if (g.gate.action === 'pass') gatePass++;
    if (mHit && !dims.includes(c.dim)) dims.forEach(d => carried.add(d));
  }
  rows.push({ ...c, n: samples.length, modHit, gateHit, gatePass, carried: [...carried] });
}
console.log('=== r308 候选定夺（模块层自命中 → gate 层穿透实测）===');
for (const r of rows) {
  if (r.err) { console.log(r.dim.padEnd(26), 'ERR', r.err); continue; }
  console.log(
    r.dim.padEnd(26),
    `模块 ${String(r.modHit).padStart(2)}/${r.n}`,
    `gate归因 ${String(r.gateHit).padStart(2)}/${r.n}`,
    `gate pass ${String(r.gatePass).padStart(2)}/${r.n}`,
    r.carried.length ? '代拦:' + r.carried.join(',') : ''
  );
}
