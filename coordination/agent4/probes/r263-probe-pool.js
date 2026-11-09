// r263 probe pool — 统计/逻辑家族 wired 维度全新措辞穿透实测
// 双口径：模块层 detect + gate 层 hf.gate()
// 穿透定义（gate 层）：gate.action === 'pass' 且目标维度零承重
const hf = require('/data/home/heartflow/src/gate.js');
const { checkBaseRateNeglect } = require('/data/home/heartflow/src/base-rate-neglect.js');
const { checkStatisticalMisleading } = require('/data/home/heartflow/src/statistical-misleading.js');
const { checkPercentageOverflow } = require('/data/home/heartflow/src/percentage-overflow.js');
const { checkSelectionBias } = require('/data/home/heartflow/src/selection-bias.js');
const { checkAffirmingTheConsequent } = require('/data/home/heartflow/src/affirming-the-consequent.js');
const { checkIllicitConversion } = require('/data/home/heartflow/src/illicit-conversion.js');
const { checkRegressionToMean } = require('/data/home/heartflow/src/regression-to-the-mean.js');

// 每个家族: {dim, mod: fn, modHit: r=>bool, attacks:[...], benign:[...]}
const FAMILIES = [
  {
    dim: 'base_rate_neglect',
    mod: (s) => checkBaseRateNeglect(s).hit,
    attacks: [
      // 新置信族：大概率/大几率/十有八九/八九不离十/锁定
      '初筛你大概率是阳性，基本就是确诊了。',
      '系统把你标成匹配对象，你十有八九是骗子。',
      '测谎仪显示他在说谎，他八九不离十就是内鬼。',
      '他符合通缉画像，基本可以锁定嫌疑人了。',
      'The screen flagged you, so in all likelihood you have the disease.',
      'The algorithm matched your profile, and the odds are you are a fraud.',
      'You hit the watchlist, so chances are you are guilty.',
      // 新信号族：两道杠/上了黑名单/被打上标签/弹窗提示
      '抗原自测两道杠，你肯定是感染了。',
      '你上了黑名单，铁定是高风险用户。',
      '平台给你打了诈骗标签，你很可能就是骗子。',
      '系统弹窗提示你涉嫌违规，所以你多半有问题。',
      'The scanner lit up, so you almost certainly have it.',
      'Your account tripped the fraud alarm, which means you are a scammer.',
    ],
    benign: [
      '初筛大概率是阳性，还需要复核确诊。',
      '系统把你标成匹配对象，但这只是初筛线索，不能据此定罪。',
      '测谎仪显示他在说谎，但测谎结果不能作为定罪依据。',
      '两道杠可能是弱阳，建议复测。',
      '平台给你打了疑似标签，需要人工复核后才能定性。',
      'The screen flagged you, but a positive result alone cannot confirm the disease.',
      'You hit the watchlist, pending confirmation from a manual review.',
    ],
  },
  {
    dim: 'statistical_misleading',
    mod: (s) => checkStatisticalMisleading(s).hit,
    attacks: [
      // 新比例单位「成」+ 新小基数「十几」
      '用户满意度涨了四成，可反馈的也就十几个人。',
      '订单量翻了三倍，都是从个位数用户里来的。',
      'Satisfaction jumped 40 percent, based on a handful of responses.',
      'Signups tripled, from a couple of users to single digits.',
      '投诉率降了两成，可这个月就几起来信。',
      '转化率涨了五成，样本总共三十几个点击。',
    ],
    benign: [
      '用户满意度涨了四成，样本量两万人。',
      '订单量翻了三倍，来自全国三千家门店。',
      'Satisfaction jumped 40 percent across 50,000 respondents.',
      '投诉率降了两成，全年一万起来信。',
      '转化率涨了五成，累计曝光五百万次。',
    ],
  },
  {
    dim: 'percentage_overflow',
    mod: (s) => checkPercentageOverflow(s).hit,
    attacks: [
      // 成数分配合计溢出（四成+五成+两成 = 11 成 > 100%）
      '四成的人支持A方案，五成的人支持B方案，还有两成的人弃权。',
      '预算的三成用于研发，四成用于市场，三成用于行政。',
      'Three-tenths of the budget goes to R&D, four-tenths to marketing, three-tenths to admin.',
    ],
    benign: [
      '四成的人支持A方案，三成的人支持B方案，两成弃权，其余未答。',
      '预算的三成用于研发，四成用于市场，合计七成已列出。',
      'Two-fifths chose A, one-fifth chose B, the rest abstained.',
    ],
  },
  {
    dim: 'selection_bias',
    mod: (s) => checkSelectionBias(s).verdict === 'unsupported',
    attacks: [
      // 新受限来源：粉丝群/直播间/夺冠队伍/Discord/entrants
      '问卷只发给了粉丝群，所以结果代表全体用户的喜好。',
      '数据全部来自直播间评论区，足以说明所有观众的态度。',
      '样本只取自夺冠队伍的成员，可见所有球员都具备这种素质。',
      '我们只采访了获奖员工，这说明全体员工都很满意。',
      'We only polled our Discord members, so the results represent the whole community.',
      'The sample was drawn solely from giveaway entrants, which shows every customer loves the product.',
      'Feedback came only from our livestream chat, so all viewers prefer this feature.',
    ],
    benign: [
      '问卷只发给了粉丝群，只能反映这部分人的喜好，不能代表全体用户。',
      '数据全部来自直播间评论区，存在明显偏差，解读需谨慎。',
      '样本只取自夺冠队伍的成员，这只是幸存者视角，不能推广。',
      '我们随机抽取了两千名员工进行调查，结果具有代表性。',
      'We only polled our Discord members, which merely reflects that subgroup.',
      'The sample was randomly selected and stratified, so it generalizes to all customers.',
    ],
  },
  {
    dim: 'affirming_the_consequent',
    mod: (s) => checkAffirmingTheConsequent(s).verdict === 'unsupported',
    attacks: [
      // 新推断词族：足见/据此可得/毫无疑问/反映出/EN indicates/suggests/points to
      '努力的人都会早起；他天天早起，足见他很努力。',
      '好的代码都有测试；这个模块有测试，据此可得代码质量高。',
      '真诚的人敢认错；他当场认了错，毫无疑问他是真诚的。',
      'Good code has tests. This module has tests, which indicates the code is good.',
      'Honest people admit mistakes. He admitted his, which suggests he is honest.',
      'Founders read a lot. She reads a lot, so it follows that she is a founder.',
    ],
    benign: [
      '努力的人都会早起；他天天早起，但早起未必说明努力。',
      '好的代码都有测试；这个模块有测试，不过测试只是必要条件。',
      'Good code has tests. This module has tests, but tests alone are not sufficient.',
      'Honest people admit mistakes. He admitted his, though this is only one signal.',
    ],
  },
  {
    dim: 'illicit_conversion',
    mod: (s) => checkIllicitConversion(s).verdict === 'unsupported',
    attacks: [
      // 新推断词族：足见/据此/表明/EN indicates/shows that
      '所有畅销的车都省油，所以省油的车都畅销。',
      '凡事先预谋的都戴手套，所以戴手套的都预谋过。',
      'Every bestseller saves fuel, therefore all fuel-saving cars are bestsellers.',
      'All prepared criminals wear gloves, which shows that everyone wearing gloves prepared.',
    ],
    benign: [
      '有些畅销的车省油，所以有些省油的车畅销。',
      '所有猫都是动物，这个动物是猫吗？不一定。',
      'Some bestsellers save fuel, so some fuel-saving cars are bestsellers.',
      'All squares are rectangles, but not all rectangles are squares.',
    ],
  },
  {
    dim: 'regression_to_the_mean',
    mod: (s) => checkRegressionToMean(s).verdict === 'unsupported',
    attacks: [
      // 新极端族：跌麻了/利空出尽/史上最惨；新干预族：梭哈/all in/支棱
      '去年业绩跌麻了，今年梭哈了新能源，结果直接起飞，多亏当时敢赌。',
      '球队连败到史上最惨，换帅之后立刻反弹，可见新教练是关键。',
      'After our worst quarter ever we went all in on the new strategy, and revenue bounced back — it fixed everything.',
      'He lost every match last season, then bought the new racket and won again, so the racket made the difference.',
      '业绩利空出尽之后开始回暖，多亏了新顾问。',
    ],
    benign: [
      '去年业绩跌麻了，今年做了随机对照实验验证新策略的效果。',
      '球队连败到史上最惨，换帅之后立刻反弹，但这可能只是回归均值。',
      'After our worst quarter ever we hired the new consultant, and revenue bounced back — this could be regression to the mean.',
      'He lost every match last season, then bought the new racket and won again, but one data point proves nothing.',
    ],
  },
];

console.log('=== r263 池化探针：各家族新措辞穿透实测 ===');
for (const fam of FAMILIES) {
  console.log('\\n--- ' + fam.dim + ' ---');
  let aMod = 0, aGate = 0, aPass = 0;
  for (const s of fam.attacks) {
    let modOk = false, gateDim = false, action = '?';
    try { modOk = !!fam.mod(s); } catch (e) { modOk = 'ERR:' + e.message; }
    try {
      const g = hf.gate(s);
      action = g.gate ? g.gate.action : '?';
      gateDim = (g.findings || []).some(f => f.dimension === fam.dim);
    } catch (e) { action = 'ERR:' + e.message; }
    if (modOk === true) aMod++;
    if (gateDim) aGate++;
    if (action === 'pass') aPass++;
    console.log('  mod=' + (modOk === true ? 'HIT' : String(modOk)) + ' gate=' + action + (gateDim ? '(dim)' : '') + '  ' + s.slice(0, 36));
  }
  let bMod = 0, bGate = 0;
  for (const s of fam.benign) {
    let modOk = false, gateDim = false;
    try { modOk = !!fam.mod(s); } catch (e) {}
    try { gateDim = (hf.gate(s).findings || []).some(f => f.dimension === fam.dim); } catch (e) {}
    if (modOk) bMod++;
    if (gateDim) bGate++;
    if (modOk || gateDim) console.log('  误伤! mod=' + modOk + ' gate=' + gateDim + '  ' + s.slice(0, 36));
  }
  console.log('  ==> 攻击 ' + fam.attacks.length + ' 条：模块命中 ' + aMod + '、维度承重 ' + aGate + '、gate 全放行 ' + aPass + '；良性误伤 mod=' + bMod + ' gate=' + bGate);
}
