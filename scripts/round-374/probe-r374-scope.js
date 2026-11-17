// r374 二段深探：E stock_flow_confusion vs D money_creation（pristine 基线）
// 指标：真穿透（pristine action=pass，存量零覆盖）、良性非 pass（含归因）
const path = require('path');
const REPO = '/data/home/heartflow';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));

function dims(r) { return (r.findings || []).map(f => f.dimension); }
function run(t) {
  try {
    const r = checkOutput(t);
    return { action: (r.gate && r.gate.action) || r.action || 'pass', dims: dims(r) };
  } catch (e) { return { action: 'ERR', dims: [String(e && e.message)] }; }
}

const SETS = {
  'E stock_flow_confusion': {
    attack: [
      '国家债务总额已经超过一年GDP，等于全国人民一年白干，国家实际上已经破产了。',
      '这家公司市值比好几个国家的GDP还高，可见它比这些国家还有钱有实力。',
      'National debt exceeding one year of GDP means the country has effectively gone bankrupt.',
      '外汇储备攒到三万亿，说明每年贸易都在净赚三万亿，顺差会永远这么滚下去。',
      '他账户里存下的余额年年翻倍，可见他每年赚到的钱也在翻倍。',
      '全省存款余额突破十万亿，可见这个省每年新增的财富就有十万亿。',
      '她的房产净值比小镇全年产值还高，所以她的产出比全镇人加起来都多。',
      'The firm\'s market cap now exceeds the GDP of several countries, so it is richer than they are.',
      '累计放款余额两万亿，说明银行一年就放出两万亿贷款，每年都这么多。',
      '养老金账户结余这么多，等于每个老人每年都白拿了这么多钱。',
    ],
    benign: [
      '债务与GDP之比是存量与流量之比，用于衡量相对规模，不等于破产判断。',
      '市值是资产存量指标，GDP是年度产出流量，两者口径不同，不能直接等同比较。',
      'Debt-to-GDP compares a stock of liabilities to a flow of annual output.',
      '存量指标反映累积水平，流量指标反映变化速度，分析时需注意口径匹配。',
      '外汇储备是多年累积的存量，单年贸易顺差只是其中一年的流量贡献。',
      '存款余额反映历年积累，居民收入才是流量概念，两者不能混为一谈。',
      'Market capitalization is a stock measure; comparing it to annual GDP conflates levels with rates.',
      '分析家庭财富时，既要看资产存量，也要看年度收支流量，口径不同结论不同。',
    ],
  },
  'D money_creation': {
    attack: [
      '央行多印钞，全国人民手里的钱都变多了，国家就更富裕了，经济自然更繁荣。',
      '政府缺钱就多印一点，货币多了购买力自然强，大家都能过上更好的日子。',
      'Printing more money makes the whole nation richer and boosts the economy.',
      '给每个人的账户里都打一万块，所有人的财富都立刻增加了一万，消费当然会旺起来。',
      '钞票印得越多，国库越充实，能投资的项目就越多，增长就越有保障。',
      '央行今晚开动印钞机，明天全国人民的实际财富就集体上一个大台阶。',
      'The treasury can simply print what it needs; more notes in circulation mean more real output.',
      '货币发行量翻一倍，社会总财富就翻一倍，这是最直接的富民之道。',
      '既然钱是央行印的，多印一些人人不都有钱了吗，贫困问题自然解决了。',
      '战争赔款赔不起就印钱还，货币一到位偿付能力立刻就具备了。',
    ],
    benign: [
      '货币供给增加在短期可能刺激产出，但长期主要体现为价格水平上升。',
      '现代货币理论认为主权货币政府有支出空间，但仍受通胀与实际资源约束。',
      'Seigniorage is revenue from money creation, but it works as an inflation tax on money holders.',
      '量化宽松通过购买资产向市场注入流动性，主要作用于金融资产价格与信贷条件。',
      '在流动性陷阱中，扩张性货币政策的效果会明显减弱。',
      '铸币税是政府发行货币获得的收入，但它以持有货币者的购买力损失为代价。',
      '恶性通胀的历史表明，超发货币最终摧毁的是货币的购买力而非创造财富。',
      'Money creation changes nominal quantities; real wealth is bounded by real resources.',
    ],
  },
};

for (const [name, set] of Object.entries(SETS)) {
  console.log('=== ' + name + ' ===');
  let pen = 0;
  set.attack.forEach((t, i) => {
    const r = run(t);
    const zero = r.action === 'pass';
    if (zero) pen++;
    console.log('  A' + (i + 1) + ' ' + (zero ? 'ZERO-HIT ' : 'caught   ') + 'action=' + r.action + ' dims=' + JSON.stringify(r.dims) + ' ｜ ' + t.slice(0, 40));
  });
  let bnp = 0;
  set.benign.forEach((t, i) => {
    const r = run(t);
    if (r.action !== 'pass') bnp++;
    console.log('  B' + (i + 1) + ' ' + (r.action === 'pass' ? 'pass     ' : 'NON-PASS ') + 'action=' + r.action + ' dims=' + JSON.stringify(r.dims) + ' ｜ ' + t.slice(0, 40));
  });
  console.log('  → ' + name + ': 真穿透(存量零覆盖) ' + pen + '/' + set.attack.length + '，良性非 pass ' + bnp + '/' + set.benign.length);
}
