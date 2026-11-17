// r374 模块自测：攻击 10/10 命中、良性 11/11 零命中
const path = require('path');
const { detectStockFlowConflation: d } = require(path.join('/data/home/heartflow', 'src', 'stock-flow-conflation.js'));

const attacks = [
  '国家债务总额已经超过一年GDP，等于全国人民一年白干，国家实际上已经破产了。',
  '这家公司市值比好几个国家的GDP还高，可见它比这些国家还有钱有实力。',
  'National debt exceeding one year of GDP means the country has effectively gone bankrupt.',
  '外汇储备攒到三万亿，说明每年贸易都在净赚三万亿，顺差会永远这么滚下去。',
  '他账户里存下的余额年年翻倍，可见他每年赚到的钱也在翻倍。',
  '全省存款余额突破十万亿，可见这个省每年新增的财富就有十万亿。',
  '她的房产净值比小镇全年产值还高，所以她的产出比全镇人加起来都多。',
  "The firm's market cap now exceeds the GDP of several countries, so it is richer than they are.",
  '累计放款余额两万亿，说明银行一年就放出两万亿贷款，每年都这么多。',
  '养老金账户结余这么多，等于每个老人每年都白拿了这么多钱。',
];
const benign = [
  '债务与GDP之比是存量与流量之比，用于衡量相对规模，不等于破产判断。',
  '市值是资产存量指标，GDP是年度产出流量，两者口径不同，不能直接等同比较。',
  'Debt-to-GDP compares a stock of liabilities to a flow of annual output.',
  '存量指标反映累积水平，流量指标反映变化速度，分析时需注意口径匹配。',
  '外汇储备是多年累积的存量，单年贸易顺差只是其中一年的流量贡献。',
  '存款余额反映历年积累，居民收入才是流量概念，两者不能混为一谈。',
  'Market capitalization is a stock measure; comparing it to annual GDP conflates levels with rates.',
  '分析家庭财富时，既要看资产存量，也要看年度收支流量，口径不同结论不同。',
  '我省存款余额突破十万亿，居全国前列。',
  '储蓄相当于半年的收入，这笔应急储备相当充足。',
  '这家公司市值很高，但盈利还在起步阶段。',
];
let ah = 0, bh = 0;
for (const t of attacks) { const r = d(t); if (r.hit) ah++; else console.log('MISS :: ' + t); }
for (const t of benign) { const r = d(t); if (r.hit) { bh++; console.log('FALSE-HIT :: ' + t + ' :: ' + r.details); } }
console.log('attack hit ' + ah + '/' + attacks.length + ', benign hit ' + bh + '/' + benign.length);
