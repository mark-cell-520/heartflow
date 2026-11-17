'use strict';
// round-374：存量-流量混淆新子族（econ_reasoning_gate 第 29 子族 / 插件层第
// 34 族）。r374 立项探针（scripts/round-374/probe-r374-pool.js +
// probe-r374-scope.js，v6.8.190 pristine 基线）七候选同池定拨：A certainty_
// effect 穿透 1/6（存量 perfect_error/confidence/absolute_claim 大量代拦）且
// 良性 2/5 脏、B absolute_advantage 3/5、C tax_incidence 2/5、D money_creation
// 7/10 但与 money_illusion(dim234) 射程相邻、E stock_flow_confusion 穿透 7/10
// 真零命中且良性 2/8 非 pass 均系存量维度误伤（monocausal_attribution /
// soft_deflection，非新族增量）、F competition_waste 穿透 2/5 且良性 3/5 脏、
// G linear_tax_revenue 3/5——**stock_flow_confusion 为「高穿透 × 良性边界最净
// × 与既有维度射程不相邻」**，定拨落地。海外扫描：arXiv OR 展开噪声零相关、
// GitHub repos 0、S2 429——空返，按既有形态自建。
// 新增 src/stock-flow-conflation.js（两腿近距共现：腿①存量指称 × 腿②流量兑现
// ZS/RATE/CMP 三形其一，缺一不判；CONCEPT/CORRECT 两组豁免 + 腿②否定守卫）。
// src/index.js 零改动、VERSION 不 bump（真升级②：已有聚合族全新措辞家族）。
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate, FAMILIES: GATE_FAMS } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const { detectStockFlowConflation: detect } = require(path.join(ROOT, 'src', 'stock-flow-conflation.js'));

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' :: ' + e.message); }
}
function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

// ─── A 攻击样本：gate 层非 pass 且 econ_reasoning_gate 归因 ───
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

console.log('### A 攻击样本 gate 层');
check('A1 ZH 攻击 8/8 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_ZH) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});
check('A2 EN 攻击 2/2 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_EN) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});

// ─── B 模块层命中 + gate 桥聚合 ───
console.log('### B 模块层');
check('B1 攻击 10/10 模块命中', () => {
  for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = detect(t);
    assert(r && r.hit, 'miss :: ' + t);
    assert(r.dimension === 'stock_flow_conflation', 'dimension 字段异常 :: ' + t);
    assert(typeof r.guidance === 'string' && r.guidance.length > 50, 'guidance 缺失 :: ' + t);
  }
});
check('B2 gate 桥聚合含 stock_flow_conflation 族', () => {
  const r = checkEconReasoningGate(ATTACK_ZH[0]);
  assert(r && r.hit, 'gate 桥未命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('stock_flow_conflation'), '聚合 families 缺 stock_flow_conflation :: ' + keys);
});

// ─── C 良性样本零误伤（模块零命中 + gate findings 不含 econ_reasoning_gate）──
console.log('### C 良性样本');
const BENIGN = [
  // 存量-流量比率是正当度量（腿②缺省——不收裸比率陈述）
  '储蓄相当于半年的收入，这笔应急储备相当充足。',
  // 概念教学（存量/流量指标口径）
  '债务与GDP之比是存量与流量之比，用于衡量相对规模，不等于破产判断。',
  // 概念教学（存量/流量速度区分）
  '存量指标反映累积水平，流量指标反映变化速度，分析时需注意口径匹配。',
  // 纠正句（不能混为一谈）
  '存款余额反映历年积累，居民收入才是流量概念，两者不能混为一谈。',
  // 存量事实陈述（腿②缺省）
  '我省存款余额突破十万亿，居全国前列。',
  // 存量事实陈述（腿②缺省）
  '这家公司市值很高，但盈利还在起步阶段。',
  // 恰当比较（收入比上年增长，无存量兑现）
  '公司收入比上年增长一成，主要来自新客户拓展。',
  // EN 概念教学
  'Debt-to-GDP compares a stock of liabilities to a flow of annual output.',
  // EN 概念教学
  'Market capitalization is a stock measure; comparing it to annual GDP conflates levels with rates.',
  // EN 存量事实陈述
  'The company holds large cash reserves and continues to invest in R&D.',
  // EN 恰当比较
  'Revenue rose five percent over last year, driven mainly by new customers.',
];
check('C1 良性 12/12 模块零命中', () => {
  for (const t of BENIGN) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中 :: ' + t);
  }
});
check('C2 良性 12/12 gate findings 不含 econ_reasoning_gate（本族零增量）', () => {
  for (const t of BENIGN) {
    assert(!dimsOf(t).includes('econ_reasoning_gate'), '本族在良性句新增 gate 增量 :: ' + t);
  }
});

// ─── D 豁免/判据结构逐组证明 ───
console.log('### D 豁免与判据结构');
check('D1 CONCEPT 豁免（存量/流量概念名 + 框架词共现，内含攻击形）', () => {
  const t = '所谓存量-流量混淆，是指把"国家债务总额超过一年GDP，等于全国人民一年白干"这类口径错误讲成破产故事。';
  const r = detect(t);
  assert(!(r && r.hit), 'CONCEPT 未豁免');
});
check('D1b EN CONCEPT 豁免（debt-to-GDP 概念名，内含攻击形）', () => {
  const t = 'Debt-to-GDP is a stock-flow ratio: national debt exceeding one year of GDP means the country has effectively gone bankrupt.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN CONCEPT 未豁免');
});
check('D1c CONCEPT 不收裸概念名（存量单独出现、无框架词 + 两腿在场必须命中）', () => {
  const t = '存量数据摆在那里：国家债务总额超过一年GDP，等于全国人民一年白干，这就是问题所在。';
  const r = detect(t);
  // 「存量」在句首但无「是指/指标/口径/之比」等框架词共现——不得误豁免攻击
  assert(r && r.hit, '裸两腿攻击被误豁免');
});
check('D2 CORRECT 豁免（不等于破产判断/不能混为一谈）', () => {
  const t = '有人拿债务总额超过一年GDP说事，等于全国人民一年白干，但这不等于破产判断，两者口径不同不能混为一谈。';
  const r = detect(t);
  assert(!(r && r.hit), 'CORRECT 未豁免');
});
check('D2b EN CORRECT 豁免（should not be equated that way）', () => {
  const t = 'National debt exceeding one year of GDP means the country has effectively gone bankrupt, but such figures should not be equated that way.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN CORRECT 未豁免');
});
check('D3 缺腿①不判（流量兑现断言在场但无存量指称）', () => {
  const t = '今年的营收等于全公司一年的白干，大家都想不通。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿①误判');
});
check('D4 缺腿②不判（存量指称在场但无流量兑现）', () => {
  const t = '全省存款余额突破十万亿，居全国前列，结构持续优化。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿②误判');
});
check('D5 腿②否定守卫（并不等于一年白干——纯否定、不落 CORRECT）', () => {
  const t = '国家债务总额虽然很高，但并不等于全国人民一年白干。';
  const r = detect(t);
  assert(!(r && r.hit), 'ZH 否定守卫失效');
});
check('D5b EN 腿②否定守卫（is not effectively bankrupt）', () => {
  const t = 'The national debt is large, but the country is not effectively bankrupt.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN 否定守卫失效');
});
check('D6 超距不判（存量指称与流量兑现相距过远）', () => {
  const t = '全省存款余额突破十万亿的消息公布后，市场各方展开了长达数月的广泛讨论，从储蓄结构、居民收入分配到货币政策的传导机制，各方专家引用了大量数据，相关部门也就此多次召开座谈会，行业协会发布了多份研究报告。而与此同时，在另一个完全无关的议题上，有人提到可见这个省每年新增的财富就有十万亿。';
  const r = detect(t);
  assert(!(r && r.hit), '超距误判');
});

// ─── E 负例注入：逐条删掉本轮每个承重模式，断言守卫必须翻转 ───
console.log('### E 负例注入');
// 每条样本对所注入常量单源承重（删后守卫翻转）。腿①四分组、腿②六分组、
// 两组豁免、腿②否定守卫各自配单源样本。注入契约：空数组 = 删条。
const INJ = {
  STOCK_ZH_A: ['这家公司市值比好几个国家的GDP还高，可见它比这些国家还有钱有实力。'],
  STOCK_ZH_B: ['他账户里存下的余额年年翻倍，可见他每年赚到的钱也在翻倍。'],
  STOCK_EN_A: ["The firm's market cap now exceeds the GDP of several countries, so it is richer than they are."],
  STOCK_EN_B: ['The company holds large cash reserves, which shows it earns that much every year.'],
  EQUATE_ZS_ZH: ['国家债务总额已经超过一年GDP，等于全国人民一年白干。'],
  EQUATE_RATE_ZH: ['全省存款余额突破十万亿，可见这个省每年新增的财富就有十万亿。'],
  EQUATE_CMP_ZH: ['这家公司市值比好几个国家的GDP还高，可见它比这些国家还有钱有实力。'],
  EQUATE_ZS_EN: ['The national debt equals a year of work for nothing for every citizen.'],
  EQUATE_RATE_EN: ['The account balance doubled every year, which shows he earns that much every year.'],
  EQUATE_CMP_EN: ["The firm's market cap now exceeds the GDP of several countries, so it is richer than they are."],
  // 两组豁免承重证明：基线被豁免不命中，删常量后翻红
  CONCEPT_ZH: ['所谓存量-流量混淆，是指把"国家债务总额超过一年GDP，等于全国人民一年白干"这类口径错误讲成破产故事。'],
  CONCEPT_EN: ['Debt-to-GDP is a stock-flow ratio: national debt exceeding one year of GDP means the country has effectively gone bankrupt.'],
  CORRECT_ZH: ['有人拿债务总额超过一年GDP说事，等于全国人民一年白干，但这不等于破产判断，两者口径不同不能混为一谈。'],
  // CORRECT_EN 单源样本：只落 CORRECT_EN（should not be equated），不落 CONCEPT_EN
  // （无 stock-flow 概念名、无 levels-with-rates），删后翻红证明承重
  CORRECT_EN: ['National debt exceeding one year of GDP means the country has effectively gone bankrupt, but such figures should not be equated that way.'],
  // 腿②否定守卫承重证明：基线被否决不命中，删否定常量后翻红（样本须纯否定、
  // 不落 CORRECT——「并不等于全国人民一年白干」的「不等于」后无混为一谈类词）
  STRONG_NEG_ZH: ['国家债务总额虽然很高，但并不等于全国人民一年白干。'],
  NEG_PREFIX_EN: ['The national debt is large, but the country is not effectively bankrupt.'],
};
let injTotal = 0, injFlipped = 0;
for (const [key, samples] of Object.entries(INJ)) {
  check('E 注入删 ' + key + ' → 守卫翻转', () => {
    for (const t of samples) {
      injTotal++;
      const base = detect(t);
      const inj = detect(t, { [key]: [] });
      const baseHit = !!(base && base.hit);
      const injHit = !!(inj && inj.hit);
      assert(baseHit !== injHit, '守卫未翻转（base=' + baseHit + ' inj=' + injHit + '）:: ' + key + ' :: ' + t);
      if (baseHit !== injHit) injFlipped++;
    }
  });
}

// ─── F 存量回归（不抢同组其它子族样本 + 存量族仍工作）──
console.log('### F 存量回归');
check('F1 healthy_user_bias 攻击样本不被本族拦', () => {
  const r = detect('吃维生素的人明显更健康，所以维生素让人健康。');
  assert(!(r && r.hit), 'stock_flow_conflation 抢 healthy_user_bias 样本');
});
check('F2 mercantilism 攻击样本不被本族拦', () => {
  const r = detect('出口大于进口才叫赚钱，顺差越大越占便宜。');
  assert(!(r && r.hit), 'stock_flow_conflation 抢 mercantilism 样本');
});
check('F3 extraordinary_claims 攻击样本不被本族拦', () => {
  const r = detect('这个疗法能治愈晚期癌症，虽然只有三例个案，但已经足够可信了。');
  assert(!(r && r.hit), 'stock_flow_conflation 抢 extraordinary_claims 样本');
});
check('F4 count_rate_conflation 近邻不被误拦（原始计数形无存量指称）', () => {
  const r = detect('我们市癌症病例全国第一，所以这里最不安全。');
  assert(!(r && r.hit), 'stock_flow_conflation 抢 count_rate_conflation 样本');
});
check('F5 money_illusion 近邻不被误拦（名义×实际形无存量兑现）', () => {
  const r = detect('工资从五千涨到六千，我的财富增加了两成，日子更宽裕了。');
  assert(!(r && r.hit), 'stock_flow_conflation 抢 money_illusion 样本');
});
check('F6 存量 benign 语料零误命中（官方良性集形状）', () => {
  const benign = [
    '两个人的合作比一个人单干更有效率。',
    '机会成本是经济学的基础概念，指被放弃的替代用途的价值。',
    'The study enrolled 1,200 participants and followed them for five years.',
    '这项临床试验共纳入三千名受试者，随访五年，结果具有统计学意义。',
    'The vaccine showed a 95% efficacy rate in the phase three trial.',
  ];
  for (const t of benign) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中官方良性形状 :: ' + t);
  }
});
check('F7 存量 econ 子族聚合仍工作（mercantilism 直调）', () => {
  const r = checkEconReasoningGate('出口大于进口才叫赚钱，顺差越大越占便宜。');
  assert(r && r.hit, 'mercantilism 存量族不再命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('mercantilism'), '存量 mercantilism 族丢失 :: ' + keys);
});
check('F8 存量 econ 子族聚合仍工作（extraordinary_claims 直调 r373 近邻）', () => {
  const r = checkEconReasoningGate('这个疗法能治愈晚期癌症，虽然只有三例个案，但已经足够可信了。');
  assert(r && r.hit, 'extraordinary_claims 存量族不再命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('extraordinary_claims'), '存量 extraordinary_claims 族丢失 :: ' + keys);
});

// ─── G 登记纪律 ───
console.log('### G 登记');
check('G1 gate 桥族表含 stock_flow_conflation(r374) 且计数 35（r379 flat_rate_bias 入表后 34→35）', () => {
  assert(GATE_FAMS.some(f => f.key === 'stock_flow_conflation' && f.round === 'r374'), 'gate 桥缺 stock_flow_conflation');
  assert.strictEqual(GATE_FAMS.length, 37, 'gate 桥计数 ' + GATE_FAMS.length); // 35(r379 后) + r381 lump_of_labor 1
});
check('G2 插件族表含 stock_flow_conflation(r374) 且计数 37（31 econ + 6 stats）', () => {
  assert(plugin.FAMILIES.some(f => f.key === 'stock_flow_conflation' && f.round === 'r374'), '插件缺 stock_flow_conflation');
  assert.strictEqual(plugin.FAMILIES.length, 42, '插件计数 ' + plugin.FAMILIES.length); // 38 + r381 lump_of_labor 1
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 36, 'econ 计数异常');
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 6, 'stats 计数异常');
});
check('G3 插件 version 已 bump 至 1.18.0（r385 再 bump）', () => {
  assert.strictEqual(plugin.version, '1.18.0', '插件 version 应为 1.18.0，实为 ' + plugin.version);
});
check('G4 插件 analyze(only=stock_flow_conflation) 路由可用', () => {
  const r = plugin.analyze(ATTACK_ZH[0], { only: 'stock_flow_conflation' });
  assert(r && r.totalHits > 0 && r.families.length === 1 && r.families[0].key === 'stock_flow_conflation', 'only 路由异常');
});
check('G5 claims.jsonl 含 r374 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } });
  assert(claims.some(c => c && c.round === 'r374' && c.agent === 'agent-4' && c.kind === 'dimension'), '缺 r374 认领');
});
check('G6 VERSION 未被 r374 改动（基线 6.8.192）', () => {
  const v = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  // r374 聚合族扩族、src/index.js 零改动、dimMap 键数不变，VERSION 不 bump。
  assert.strictEqual(v, '6.8.192', 'VERSION 应为 6.8.192（r385 基线同步：r380 duration_neglect bump），实为 ' + v);
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
console.log('负例注入: ' + injFlipped + '/' + injTotal + ' 翻转');
process.exit(fail === 0 ? 0 : 1);
