'use strict';
// round-375：政府-家庭收支类比新子族（econ_reasoning_gate 第 31 子族 / 插件层
// 第 36 族，econ 组第 30 子族）。r375 立项探针（scripts/round-375/
// probe-r375-pool.js 首轮 12 候选 + probe-r375-scope.js 二段深探，v6.8.190
// pristine 基线，HEAD 5481b78）定拨：
//   A 变化率回落≠水平下降 0/6、B 半衰期 2/3、D 赌徒破产 6/10、
//   E 百分比涨跌对称 0/3、F 加权平均 4/10、G 均衡=最优 0/3、H GDP 重复计算
//   8/10、I 选择过载 5/10、J 规模经济绝对化 0/3、K 主权货币无限支出 0/3、
//   L 保险期望值 8/10——**C 政府-家庭收支类比 8/10 真零命中且良性边界最净**
//   （良性非 pass 均系存量维度既有误伤、非本族增量），定拨落地。
//   海外扫描（hf4-scout.sh，behavioral economics reasoning errors topic）：
//   arXiv parse-fail / GitHub repos 0 / S2 ?——空返，按既有形态自建。
// 新增 src/government-household-analogy.js（三腿近距共现：腿①主权主体 ×
//   腿②私人收支框架×等价提示 × 腿③清偿/破产结论，缺一不判；CONCEPT/CORRECT
//   两组豁免 + 腿③紧前否定/对冲短语双守卫）。src/index.js 零改动、VERSION 不
//   bump（真升级②：已有聚合族全新措辞家族）。
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate, FAMILIES: GATE_FAMS } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const { detectGovernmentHouseholdAnalogy: detect } = require(path.join(ROOT, 'src', 'government-household-analogy.js'));

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' :: ' + e.message); }
}
function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

// ─── A 攻击样本：gate 层非 pass 且 econ_reasoning_gate 归因 ───
const ATTACK_ZH = [
  '国家财政跟家庭账本是一个道理，收入多少才能花多少，欠的债必须连本带利还清，否则就是破产。',
  '政府借钱和普通人借钱一样，花超了就是破产，所以财政赤字必须立刻清零。',
  '国债到期就必须全额偿还，跟还信用卡一个道理，不然国家信用就破产了。',
  '政府和企业一样，赚不到钱就会破产倒闭，所以财政必须年年有盈余。',
  '国家欠的债和房贷一样，迟早是要还的，借得越多还得越惨。',
  '政府赤字就好比个人透支信用卡，拆东墙补西墙，最后一定崩盘。',
  '治理国家跟居家过日子是一个道理，财政要量入为出，欠债必须全额清偿。',
  '主权政府如同家庭一样有借有还，债务到期不能赖，否则就是资不抵债。',
];
const ATTACK_EN = [
  'The government budget works just like a household budget — spend only what you earn and pay off the debt.',
  'A country is no different from a family: if it spends more than it earns, it goes bankrupt.',
  'A national government is just like a family maxing out its credit cards: the debt must be paid off in full or the country goes bankrupt.',
  'The treasury is like a household that has run up its credit cards — insolvency is only a matter of time.',
];

console.log('### A 攻击样本 gate 层');
check('A1 ZH 攻击 8/8 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_ZH) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});
check('A2 EN 攻击 4/4 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_EN) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});

// ─── B 模块层命中 + gate 桥聚合 ───
console.log('### B 模块层');
check('B1 攻击 12/12 模块命中', () => {
  for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = detect(t);
    assert(r && r.hit, 'miss :: ' + t);
    assert(r.dimension === 'government_household_analogy', 'dimension 字段异常 :: ' + t);
    assert(typeof r.guidance === 'string' && r.guidance.length > 50, 'guidance 缺失 :: ' + t);
  }
});
check('B2 gate 桥聚合含 government_household_analogy 族', () => {
  const r = checkEconReasoningGate(ATTACK_ZH[0]);
  assert(r && r.hit, 'gate 桥未命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('government_household_analogy'), '聚合 families 缺 government_household_analogy :: ' + keys);
});

// ─── C 良性样本零误伤（模块零命中 + gate findings 不含 econ_reasoning_gate）──
console.log('### C 良性样本');
const BENIGN = [
  // 私人域陈述（腿①缺省）
  '家庭预算要量入为出，个人借贷过度同样会导致债务危机。',
  // 正当财政分析（腿②缺省）
  '政府长期过度举债会推高利息负担并挤压公共支出，需要关注债务可持续性。',
  // 纠正/差异陈述（无等价提示）
  '主权政府可以滚动续借债务，这与家庭债务在机制上存在重要差异。',
  // 正当财政分析（腿②缺省）
  '政府在基础设施投资上的回报周期比企业长，评估标准应当不同。',
  // 正当财政分析（腿②缺省）
  '财政赤字的合理性与债务结构、增长前景有关，需要具体分析。',
  // 纯市场事实（无三腿）
  '国债收益率曲线反映了市场对未来利率和通胀的预期。',
  // EN 私人域
  'A household that spends more than it earns will eventually face insolvency.',
  // EN 正当财政分析
  'Sovereign debt sustainability depends on growth, inflation, and debt structure.',
  // EN 私人域（公司是私人主体，非主权）
  'The company must repay its bonds at maturity or it will default.',
  // 纠正句（不等于家庭账本）
  '政府预算不等于家庭账本，主权政府可以滚动发债，不会因为债台高筑而破产。',
  // 对冲形（跟家庭一样，但并不意味着会破产——腿③对冲守卫）
  '政府跟家庭一样要过日子，但并不意味着债台高筑就会破产。',
  // EN 对冲形（does not mean it will go bankrupt）
  'The government works like a household budget, but that does not mean it will go bankrupt.',
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
check('D1 CONCEPT 豁免（类比谬误讨论，内含攻击形）', () => {
  const t = '把国家财政比作家庭预算是一种常见的类比谬误：政府跟家庭一样，欠的债必须连本带利还清，否则就是破产。';
  const r = detect(t);
  assert(!(r && r.hit), 'CONCEPT 未豁免');
});
check('D1b EN CONCEPT 豁免（classic fallacy 概念讨论，内含攻击形）', () => {
  const t = 'The claim that a government works just like a household budget is a classic fallacy, but in truth the debt must be paid off in full or the country goes bankrupt.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN CONCEPT 未豁免');
});
check('D1c CONCEPT 不收裸概念名（「教科书讲过家庭预算的原理」无框架词，两腿在场必须命中）', () => {
  const t = '教科书讲过家庭预算的原理，现在来看：国家财政跟家庭账本是一个道理，欠的债必须连本带利还清，否则就是破产。';
  const r = detect(t);
  assert(r && r.hit, '裸两腿攻击被误豁免');
});
check('D2 CORRECT 豁免（不等于家庭账本 + 不能混为一谈，内含攻击形）', () => {
  const t = '政府预算不等于家庭账本，虽说跟家庭一样，但把欠的债必须连本带利还清否则就是破产这套搬过来，本身就是混淆视听。';
  const r = detect(t);
  assert(!(r && r.hit), 'CORRECT 未豁免');
});
check('D2b EN CORRECT 豁免（is not a household，内含攻击形）', () => {
  const t = 'The government is not a household and cannot be analyzed that way, even though some claim its budget works like a family budget and the debt must be paid off in full or the country goes bankrupt.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN CORRECT 未豁免');
});
check('D3 缺腿①不判（私人域收支陈述在场但无主权主体）', () => {
  const t = '家庭预算要量入为出，欠的债必须连本带利还清，否则就是破产。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿①误判');
});
check('D4 缺腿②不判（主权主体 + 清偿结论在场但无比喻框架）', () => {
  const t = '国债到期就必须全额偿还，否则国家信用就会破产。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿②误判');
});
check('D5 缺腿③不判（主权主体 + 比喻在场但无清偿结论）', () => {
  const t = '国家财政跟家庭账本是一个道理，收入多少才能花多少。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿③误判');
});
check('D6 腿③否定守卫（并不意味着债台高筑就会破产——对冲形）', () => {
  const t = '政府跟家庭一样要过日子，但并不意味着债台高筑就会破产。';
  const r = detect(t);
  assert(!(r && r.hit), 'ZH 对冲守卫失效');
});
check('D6b EN 腿③否定守卫（does not mean it will go bankrupt）', () => {
  const t = 'The government works like a household budget, but that does not mean it will go bankrupt.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN 对冲守卫失效');
});
check('D7 超距不判（主权主体与清偿结论相距过远）', () => {
  const t = '国家财政最近在讨论预算编制的方法论问题，相关部门召开了多次座谈会，邀请了各界专家参与，从收入预测、支出结构到绩效评估形成了厚厚的报告，各方还就公开透明环节交换了意见。而与此同时，有人翻出旧账说欠的钱必须连本带利还清，否则就是破产。';
  const r = detect(t);
  assert(!(r && r.hit), '超距误判');
});

// ─── E 负例注入：逐条删掉本轮每个承重模式，断言守卫必须翻转 ───
console.log('### E 负例注入');
// 每条样本对所注入常量单源承重（删后守卫翻转）。腿①/腿②/腿③、两组豁免、
// 腿③否定 + 对冲双守卫各自配单源样本。注入契约：空数组 = 删条。
const INJ = {
  SOV_ZH: ['国家财政跟家庭账本是一个道理，欠的债必须连本带利还清，否则就是破产。'],
  SOV_EN: ['The government budget works just like a household budget — spend only what you earn and pay off the debt.'],
  ANALOGY_ZH: ['国家财政跟家庭账本是一个道理，欠的债必须连本带利还清，否则就是破产。'],
  ANALOGY_EN: ['The government budget works just like a household budget — spend only what you earn and pay off the debt.'],
  PAYOFF_ZH: ['国家财政跟家庭账本是一个道理，欠的债必须连本带利还清。'],
  PAYOFF_EN: ['The government budget works just like a household budget — spend only what you earn and pay off the debt.'],
  // 两组豁免承重证明：基线被豁免不命中，删常量后翻红
  CONCEPT_ZH: ['把国家财政比作家庭预算是一种常见的类比谬误：政府跟家庭一样，欠的债必须连本带利还清，否则就是破产。'],
  CONCEPT_EN: ['The claim that a government works just like a household budget is a classic fallacy, but in truth the debt must be paid off in full or the country goes bankrupt.'],
  CORRECT_ZH: ['政府预算不等于家庭账本，虽说跟家庭一样，但把欠的债必须连本带利还清否则就是破产这套搬过来，本身就是混淆视听。'],
  CORRECT_EN: ['The government is not a household and cannot be analyzed that way, even though some claim its budget works like a family budget and the debt must be paid off in full or the country goes bankrupt.'],
  // 腿③双守卫承重证明：基线被否决不命中，删守卫常量后翻红。两样本各自单源
  // 承重——NEG 样本只落紧前否定（「这并非破产」贴身 6 字内），不落对冲短语
  // （无「意味着/说明」类认识动词）；HEDGE 样本只落对冲短语（否定与结论隔有
  // 从句，贴身 6 字内无否定词），删对应常量后各自翻红。
  NEG_ZH: ['政府跟家庭一样，但这并非破产逻辑。'],
  NEG_EN: ['The government works like a household budget, but that is not bankruptcy.'],
  HEDGE_ZH: ['政府跟家庭一样要过日子，但并不意味着债台高筑就会破产。'],
  HEDGE_EN: ['The government works like a household budget, but that does not mean it will go bankrupt.'],
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
check('F1 tax_incidence 攻击样本不被本族拦', () => {
  const r = detect('对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。');
  assert(!(r && r.hit), 'government_household_analogy 抢 tax_incidence 样本');
});
check('F2 mercantilism 攻击样本不被本族拦', () => {
  const r = detect('出口大于进口才叫赚钱，顺差越大越占便宜。');
  assert(!(r && r.hit), 'government_household_analogy 抢 mercantilism 样本');
});
check('F3 extraordinary_claims 攻击样本不被本族拦', () => {
  const r = detect('这个疗法能治愈晚期癌症，虽然只有三例个案，但已经足够可信了。');
  assert(!(r && r.hit), 'government_household_analogy 抢 extraordinary_claims 样本');
});
check('F4 stock_flow_conflation 近邻不被误拦（存量陈述无清偿结论）', () => {
  const r = detect('国家债务总额已经超过一年GDP，等于全国人民一年白干，国家实际上已经破产了。');
  assert(!(r && r.hit), 'government_household_analogy 抢 stock_flow_conflation 样本');
});
check('F5 price_control 近邻不被误拦（管制断言无三腿）', () => {
  const r = detect('房租上限一设，租客负担必然下降，供给自动会跟上。');
  assert(!(r && r.hit), 'government_household_analogy 抢 price_control 样本');
});
check('F6 官方良性语料形状零误命中', () => {
  const benign = [
    '两个人的合作比一个人单干更有效率。',
    '机会成本是经济学的基础概念，指被放弃的替代用途的价值。',
    'The study enrolled 1,200 participants and followed them for five years.',
    '这项临床试验共纳入三千名受试者，随访五年，结果具有统计学意义。',
    'The vaccine showed a 95% efficacy rate in the phase three trial.',
    '政府预算不等于家庭账本，主权政府可以滚动发债。',
  ];
  for (const t of benign) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中官方良性形状 :: ' + t);
  }
});
check('F7 存量 econ 子族聚合仍工作（tax_incidence 直调）', () => {
  const r = checkEconReasoningGate('对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。');
  assert(r && r.hit, 'tax_incidence 存量族不再命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('tax_incidence'), '存量 tax_incidence 族丢失 :: ' + keys);
});
check('F8 存量 econ 子族聚合仍工作（stock_flow_conflation 直调）', () => {
  const r = checkEconReasoningGate('国家债务总额已经超过一年GDP，等于全国人民一年白干，国家实际上已经破产了。');
  assert(r && r.hit, 'stock_flow_conflation 存量族不再命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('stock_flow_conflation'), '存量 stock_flow_conflation 族丢失 :: ' + keys);
});

// ─── G 登记纪律 ───
console.log('### G 登记');
check('G1 gate 桥族表含 government_household_analogy(r375) 且计数 35（r379 flat_rate_bias 入表后 34→35）', () => {
  assert(GATE_FAMS.some(f => f.key === 'government_household_analogy' && f.round === 'r375'), 'gate 桥缺 government_household_analogy');
  assert.strictEqual(GATE_FAMS.length, 42, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 1 + r387 1 + r388 1 + r389 1 + r392 1
});
check('G2 插件族表含 government_household_analogy(r375) 且计数 44（36 econ + 8 stats）', () => {
  assert(plugin.FAMILIES.some(f => f.key === 'government_household_analogy' && f.round === 'r375'), '插件缺 government_household_analogy');
  assert.strictEqual(plugin.FAMILIES.length, 47, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 1 + r387 1 + r388 1 + r389 1 + r392 1
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 36, 'econ 计数异常');
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11, 'stats 计数异常');
});
check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {
  assert.strictEqual(plugin.version, '1.23.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);
});
check('G4 插件 analyze(only=government_household_analogy) 路由可用', () => {
  const r = plugin.analyze(ATTACK_ZH[0], { only: 'government_household_analogy' });
  assert(r && r.totalHits > 0 && r.families.length === 1 && r.families[0].key === 'government_household_analogy', 'only 路由异常');
});
check('G5 claims.jsonl 含 r375 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } });
  assert(claims.some(c => c && c.round === 'r375' && c.agent === 'agent-4' && c.kind === 'dimension'), '缺 r375 认领');
});
check('G6 VERSION 未被 r375 改动（基线 6.8.192）', () => {
  const v = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  // r375 聚合族扩族、src/index.js 零改动、dimMap 键数不变，VERSION 不 bump。
  assert.strictEqual(v, '6.8.192', 'VERSION 应为 6.8.192（r385 基线同步：r380 duration_neglect bump），实为 ' + v);
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
console.log('负例注入: ' + injFlipped + '/' + injTotal + ' 翻转');
process.exit(fail === 0 ? 0 : 1);
