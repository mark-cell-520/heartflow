// r374 接线自测：gate 桥 + 插件层 + 归因
const path = require('path');
const ROOT = '/data/home/heartflow';
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate, FAMILIES: GATE_FAMS } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

const ATTACK_ZH = [
  '国家债务总额已经超过一年GDP，等于全国人民一年白干，国家实际上已经破产了。',
  '这家公司市值比好几个国家的GDP还高，可见它比这些国家还有钱有实力。',
  '外汇储备攒到三万亿，说明每年贸易都在净赚三万亿，顺差会永远这么滚下去。',
  '他账户里存下的余额年年翻倍，可见他每年赚到的钱也在翻倍。',
  '全省存款余额突破十万亿，可见这个省每年新增的财富就有十万亿。',
  '她的房产净值比小镇全年产值还高，所以她的产出比全镇人加起来都多。',
  '累计放款余额两万亿，说明银行一年就放出两万亿贷款，每年都这么多。',
  '养老金账户结余这么多，等于每个老人每年都白拿了这么多钱。',
];
const ATTACK_EN = [
  'National debt exceeding one year of GDP means the country has effectively gone bankrupt.',
  "The firm's market cap now exceeds the GDP of several countries, so it is richer than they are.",
];
let fail = 0;
function ck(name, cond, extra) {
  if (!cond) { fail++; console.log('FAIL ' + name + (extra ? ' :: ' + extra : '')); }
  else console.log('ok   ' + name);
}
for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
  const r = gcheck(t);
  const action = r.gate ? r.gate.action : r.action;
  const dims = (r.findings || []).map(f => f.dimension);
  ck('gate 非 pass 且归因 econ_reasoning_gate :: ' + t.slice(0, 24), action !== 'pass' && dims.includes('econ_reasoning_gate'), 'action=' + action + ' dims=' + JSON.stringify(dims));
}
// gate 桥聚合
const br = checkEconReasoningGate(ATTACK_ZH[0]);
ck('gate 桥聚合含 stock_flow_conflation', br && br.hit && (br.families || []).some(f => f.key === 'stock_flow_conflation'), JSON.stringify((br.families || []).map(f => f.key)));
// 插件层
const pr = plugin.analyze(ATTACK_ZH[0], { only: 'stock_flow_conflation' });
ck('插件 only 路由命中', pr && pr.totalHits > 0 && pr.families.length === 1 && pr.families[0].key === 'stock_flow_conflation', JSON.stringify(pr && pr.families));
ck('gate 桥族表 29', GATE_FAMS.length === 29, 'len=' + GATE_FAMS.length);
ck('插件族表 34 / econ 28', plugin.FAMILIES.length === 34 && plugin.FAMILIES.filter(f => f.group === 'econ').length === 28, 'len=' + plugin.FAMILIES.length + ' econ=' + plugin.FAMILIES.filter(f => f.group === 'econ').length);
ck('插件 version 1.10.0', plugin.version === '1.10.0', plugin.version);
// 存量族回归
for (const [label, t, key] of [
  ['mercantilism', '出口大于进口才叫赚钱，顺差越大越占便宜。', 'mercantilism'],
  ['healthy_user_bias', '吃维生素的人明显更健康，所以维生素让人健康。', 'healthy_user_bias'],
  ['extraordinary_claims', '这个疗法能治愈晚期癌症，虽然只有三例个案，但已经足够可信了。', 'extraordinary_claims'],
]) {
  const rr = checkEconReasoningGate(t);
  ck('存量族仍工作 :: ' + label, rr && rr.hit && (rr.families || []).some(f => f.key === key));
}
console.log(fail === 0 ? 'ALL OK' : fail + ' FAILURES');
process.exit(fail === 0 ? 0 : 1);
