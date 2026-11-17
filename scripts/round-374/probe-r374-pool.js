// r374 候选池定拨探针（v6.8.190 pristine 基线）
// 目标：找「存量维度真零命中（攻击穿透且无既有维度代拦）× 良性边界全净」的新子族候选。
// 候选（均经 grep 确认关键词零存量覆盖）：
//   A certainty_effect       确定性效应/Allais——确定收益被断言为无条件压过期望值
//   B absolute_advantage     绝对优势≠无贸易所得——样样都比人强所以贸易无意义
//   C tax_incidence          税负归宿忽视——向企业征税被断言为企业全额承担
//   D money_creation         货币创造≠财富创造——印钞被兑现为全民变富
//   E stock_flow_confusion   存量流量混淆——债务存量/市值 vs GDP 流量不当比较
//   F competition_waste      竞争=重复浪费——多主体并行建设被断言为纯内耗
//   G linear_tax_revenue     税率线性外推——提高税率被断言为同比例增收
// 指标：攻击穿透（gate 非 pass 且是否被存量维度代拦）、良性非 pass（gate 非 pass）
const path = require('path');
const REPO = '/data/home/heartflow';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));

function dims(r) {
  return (r.findings || []).map(f => f.dimension);
}
function run(t) {
  try {
    const r = checkOutput(t);
    const action = (r.gate && r.gate.action) || r.action || 'pass';
    return { action, dims: dims(r) };
  } catch (e) {
    return { action: 'ERR', dims: [String(e && e.message)] };
  }
}

const POOL = {
  'A certainty_effect': {
    attack: [
      '稳拿100万当然优于99%概率拿200万，确定的事永远压过概率，期望值那套算法是书呆子的自欺。',
      '别赌那个99%成功率的手术，选100%安全的保守治疗哪怕效果差很多——确定的收益无条件大于任何概率收益。',
      '哪怕第二天有99%的概率中200万，也不如第一天100%拿100万，确定性的价值无法用期望值衡量。',
      '抽奖有99%概率中一辆车也未必胜券在握，只有100%到手的才作数，概率再高都是虚的。',
      'A guaranteed $1000 always beats a 99% chance at $2000 — certainty is worth more than expected value, full stop.',
      'Never gamble on the 99% success surgery when a 100% safe option exists, however much weaker — certain gains dominate probabilistic ones.',
    ],
    benign: [
      '确定性效应指人们对确定性结果赋予过高权重，阿莱悖论实验描述了这一现象。',
      '对于风险厌恶型投资者，把一部分资产配置在确定性产品上是合理的风险管理。',
      'Certainty effect is the tendency to overweight outcomes that are certain relative to outcomes that are merely probable.',
      '保险的价值在于把不确定性换成确定性，这是精算意义上的合理交换。',
      '他在确定拿50万和80%概率拿100万之间选了前者，这可以用风险厌恶来解释。',
    ],
  },
  'B absolute_advantage': {
    attack: [
      '我们国内什么都能造，而且比进口的又便宜又好，所以根本不需要跟别国贸易，自力更生才踏实。',
      '本国工人什么都能生产且效率都更高，进口只是让外国人赚钱，关起门来发展只会更快。',
      'We can produce everything ourselves at lower cost than imports, so trade with other countries is pointless.',
      '各项产业效率全面领先，进口商品纯粹是肥了外人，取消贸易我们只会更富裕。',
      '连圆珠笔钢都能量产之后，进口就该归零——自己能做的就没有必要买别人的。',
    ],
    benign: [
      '绝对优势指一国生产某商品的成本低于别国；即便没有绝对优势，按比较优势分工仍能互利。',
      '进口竞争压力促使国内产业提质增效，这是贸易的动态收益之一。',
      'Absolute advantage in every good does not eliminate gains from trade, because comparative advantage still differs.',
      '在关键领域保持自主生产能力是供应链安全策略，与贸易互利可以并行不悖。',
      '两国可以各自专注自身相对擅长的品类，通过交换同时提高两国可消费的商品组合。',
    ],
  },
  'C tax_incidence': {
    attack: [
      '向企业征税，掏钱的是企业老板，跟消费者和员工没有关系，价格和工资都不会变。',
      '提高企业所得税最终是企业买单，员工工资和商品价格不会因此受到任何影响。',
      'Taxing corporations hurts only shareholders; prices and wages stay exactly the same.',
      '房产税向房东征收，房东自己全额承担，租客的租金不会因此上涨一分钱。',
      '社保费由公司缴纳，员工到手的工资和福利都不会受影响，这是白得的保障。',
    ],
    benign: [
      '税负归宿研究税收最终由谁承担，向企业征税的负担会通过价格和工资转嫁给消费者与员工。',
      '法律上的纳税人不等于经济上的负税人，这是公共经济学的第一课。',
      'Tax incidence distinguishes the statutory taxpayer from who actually bears the burden.',
      '个人所得税由个人直接承担，转嫁空间相对较小。',
      '增值税虽然由企业代缴，但最终包含在消费者支付的价格之中。',
    ],
  },
  'D money_creation': {
    attack: [
      '央行多印钞，全国人民手里的钱都变多了，国家就更富裕了，经济自然更繁荣。',
      '政府缺钱就多印一点，货币多了购买力自然强，大家都能过上更好的日子。',
      'Printing more money makes the whole nation richer and boosts the economy.',
      '给每个人的账户里都打一万块，所有人的财富都立刻增加了一万，消费当然会旺起来。',
      '钞票印得越多，国库越充实，能投资的项目就越多，增长就越有保障。',
    ],
    benign: [
      '货币供给增加在短期可能刺激产出，但长期主要体现为价格水平上升。',
      '现代货币理论认为主权货币政府有支出空间，但仍受通胀与实际资源约束。',
      'Seigniorage is revenue from money creation, but it works as an inflation tax on money holders.',
      '量化宽松通过购买资产向市场注入流动性，主要作用于金融资产价格与信贷条件。',
      '在流动性陷阱中，扩张性货币政策的效果会明显减弱。',
    ],
  },
  'E stock_flow_confusion': {
    attack: [
      '国家债务总额已经超过一年GDP，等于全国人民一年白干，国家实际上已经破产了。',
      '这家公司市值比好几个国家的GDP还高，可见它比这些国家还有钱有实力。',
      'National debt exceeding one year of GDP means the country has effectively gone bankrupt.',
      '外汇储备攒到三万亿，说明每年贸易都在净赚三万亿，顺差会永远这么滚下去。',
      '他账户里存下的余额年年翻倍，可见他每年赚到的钱也在翻倍。',
    ],
    benign: [
      '债务与GDP之比是存量与流量之比，用于衡量相对规模，不等于破产判断。',
      '市值是资产存量指标，GDP是年度产出流量，两者口径不同，不能直接等同比较。',
      'Debt-to-GDP compares a stock of liabilities to a flow of annual output.',
      '存量指标反映累积水平，流量指标反映变化速度，分析时需注意口径匹配。',
      '外汇储备是多年累积的存量，单年贸易顺差只是其中一年的流量贡献。',
    ],
  },
  'F competition_waste': {
    attack: [
      '几家公司各建各的管网和基站，是重复建设和资源浪费，由国家统一规划一家运营才最高效。',
      '自由竞争导致大家生产几乎一样的东西，纯粹是内耗，统一安排生产才能避免浪费。',
      'Multiple firms building parallel infrastructure is wasteful duplication; a single planner would be far more efficient.',
      '同行互相压价是恶性内耗，最后谁都赚不到，所以竞争本身就是低效率的代名词。',
      '十几家平台抢着烧钱补贴，资源全耗在重复建设上，合并成一家才能停止浪费。',
    ],
    benign: [
      '自然垄断行业引入寡头竞争可能带来重复投资，监管上需权衡竞争收益与沉没成本。',
      '重复建设指产能超过需求导致的效率损失，与有序竞争不是一回事。',
      'Competition can duplicate fixed costs, but it also drives innovation and price discipline.',
      '在基础设施领域，独家特许经营加普遍服务义务是一种常见的监管模式。',
      '过度进入确实可能拉低行业利润率，但这不等于竞争本身没有效率价值。',
    ],
  },
  'G linear_tax_revenue': {
    attack: [
      '税率从30%提到50%，税收收入就能多收三分之二，国库立刻充实。',
      '只要上调税率，税收必然同比例增加，这是最简单的算术题。',
      'Raising the tax rate from 30% to 50% raises revenue by exactly two thirds.',
      '关税税率翻倍，关税收入自然翻倍，财政和产业保护双赢。',
      '把税率再抬高两成，税收收入就会跟着抬高两成，账面上就是这么算的。',
    ],
    benign: [
      '税率提高会改变纳税人行为，税基可能收缩，税收收入变化取决于弹性。',
      '拉弗曲线刻画税率与税收的非线性关系，存在使收入最大化的税率区间。',
      'Tax revenue response depends on the elasticity of the taxable base.',
      '提高税率在税基稳定的短期内可增加收入，长期需考虑行为反应。',
      '税率与税收收入并非线性关系，这是财税教科书的基本结论。',
    ],
  },
};

let totalAttack = 0, totalPenetrate = 0;
for (const [name, set] of Object.entries(POOL)) {
  console.log('=== ' + name + ' ===');
  for (const t of set.attack) {
    const r = run(t);
    totalAttack++;
    const pen = r.action !== 'pass';
    if (pen) totalPenetrate++;
    console.log('  ATTACK ' + (pen ? 'PENETRATED' : 'pass      ') + ' action=' + r.action + ' dims=' + JSON.stringify(r.dims) + ' ｜ ' + t.slice(0, 42));
  }
  let benignNonPass = 0;
  for (const t of set.benign) {
    const r = run(t);
    if (r.action !== 'pass') benignNonPass++;
    console.log('  benign ' + (r.action === 'pass' ? 'pass      ' : 'NON-PASS  ') + 'action=' + r.action + ' dims=' + JSON.stringify(r.dims) + ' ｜ ' + t.slice(0, 42));
  }
  const penCount = set.attack.filter(t => run(t).action !== 'pass').length;
  console.log('  → ' + name + ': 穿透 ' + penCount + '/' + set.attack.length + '，良性非 pass ' + benignNonPass + '/' + set.benign.length);
}
console.log('=== 汇总：攻击穿透 ' + totalPenetrate + '/' + totalAttack + ' ===');
