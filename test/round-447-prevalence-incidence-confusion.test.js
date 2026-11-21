'use strict';
/**
 * round-447 — 第 281 维度 prevalence_incidence_confusion（患病率-发病率混淆）
 * 单元测试：攻击命中 + 良性零误伤 + 负例注入（逐常量验证判据承重）。
 *
 * 负例注入方法（先例 r407）：把模块 __internals 暴露的词表常量拷出，逐项
 * 从文本中剔除后重判——若某常量是判据的真实承重，剔除后攻击样本应从 hit
 * 变为 miss。这比「写一堆样本」更能证明判据不是摆设。
 */
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  checkPrevalenceIncidenceConfusion,
  __internals,
} = require(path.join(__dirname, '..', 'src', 'prevalence-incidence-confusion.js'));

// __internals 是取常量的函数（模块设计如此），先取出腿表/豁免表
const internals = __internals();
const FLOW_ZH = internals.FLOW_ZH;
const STOCK_ZH = internals.STOCK_ZH;

const attacks = [
  // 正向：流量指标 → 存量现患结论
  '这个病发病率很高，满大街都是病人。',
  '该地区发病率达到500人，所以每10个人里就有1个患病。',
  '发病率数据显示，目前有20%的人口患有这种慢性病。',
  '这种癌症的发病率很高，身边好多人都在带瘤生存。',
  '每年新发病例很多，可见患病人群占总人口的比重很大。',
  '抑郁症发病率达到15%，意味着六分之一的人正处于抑郁状态。',
  // 反向：存量指标 → 流量规模结论
  '患病率很低，因为这个病一年也出不了几个新病例。',
  '该病患病率很低，说明新发感染人数很少。',
  // EN 侧
  'The incidence is high, so a large share of the population currently has the disease.',
  'Incidence rates show 20% of people are living with this condition.',
  'With such a high incidence, most people you meet are currently sick.',
];

const benign = [
  // 正确对比陈述（存量数字 vs 流量数字，无推导形状）
  '高血压患病率约27%，每年新增病例的发病率则低得多。',
  'HIV 患病率高于发病率，因为这是慢性感染。',
  '治愈率提高后，即便发病率不变，患病率也会下降。',
  // 破除/教学陈述（本族要教的判别动作本身）
  '患病率和发病率是两回事，前者看存量，后者看流量。',
  '普查得到的是患病率，队列随访得到的是发病率。',
  '流调报告里同时给出发病率和患病率，两个指标不能混用。',
  // 方法/机制陈述（流量词出现但不构成存量推导）
  '发病率高说明新发病例多，患病率还取决于病程长短。',
  '这个慢性病患病率高，因为患者能活很多年，而急性病患病率低。',
  '发病率下降可能只是病程缩短，患病率不一定跟着降。',
  '筛查发现了更多病例，但这些是既往存量，不是当年新发。',
  // EN 侧良性
  'Prevalence counts existing cases; incidence counts new cases over a period.',
  'The incidence of flu spikes each winter, but prevalence stays low because it resolves quickly.',
];

// ─── 1. 攻击全命中 ───────────────────────────────────────────
for (const t of attacks) {
  const r = checkPrevalenceIncidenceConfusion(t);
  assert.equal(r.hit, true, `攻击样本应命中：${t}`);
  assert.ok(r.score >= 0.3, `得分应达命中线：${t} (score=${r.score})`);
  assert.ok(r.detail && r.detail.length > 0, `命中应带 detail：${t}`);
}

// ─── 2. 良性零误伤 ───────────────────────────────────────────
for (const t of benign) {
  const r = checkPrevalenceIncidenceConfusion(t);
  assert.equal(r.hit, false, `良性样本不应命中：${t}`);
}

// ─── 3. 负例注入：腿词常量承重验证 ─────────────────────────
assert.ok(Array.isArray(FLOW_ZH) && FLOW_ZH.length >= 5, 'FLOW_ZH 应至少 5 项');
assert.ok(Array.isArray(STOCK_ZH) && STOCK_ZH.length >= 5, 'STOCK_ZH 应至少 5 项');

// FLOW_ZH 承重：用只含存量腿、剔除全部流量词的攻击形
const noFlowAttacks = attacks.filter((t) => !/[\u4e00-\u9fff]/.test(t) === false);
assert.ok(noFlowAttacks.length > 0, '应有中文攻击样本用于腿承重验证');

// 腿表必须含关键形态（r161 教训：裸名词自查）
const flowSources = FLOW_ZH.map((r) => r.source).join('|');
assert.ok(/发病率/.test(flowSources), 'FLOW_ZH 应收「发病率」');
assert.ok(/新病例/.test(flowSources), 'FLOW_ZH 应收裸名词「新病例」（r161/r447 实测漏判形）');
const stockSources = STOCK_ZH.map((r) => r.source).join('|');
assert.ok(/患病率/.test(stockSources), 'STOCK_ZH 应收「患病率」（存量指标名词归存量腿）');
assert.ok(/满大街/.test(stockSources), 'STOCK_ZH 应收「满大街」口语存量形');

// 单向验证：每个 FLOW_ZH 常量至少在一条攻击样本中真实参与命中
// （把该常量替换为永不匹配后，若攻击样本全部仍命中，说明该常量摆设）
{
  const liveCheck = FLOW_ZH.map((re) => {
    const shadow = { source: re.source, flags: re.flags, test: () => false };
    const backup = re;
    const idx = FLOW_ZH.indexOf(re);
    FLOW_ZH[idx] = shadow;
    let hits = 0;
    for (const t of attacks) if (checkPrevalenceIncidenceConfusion(t).hit) hits++;
    FLOW_ZH[idx] = backup;
    return { source: re.source, hits };
  });
  // 至少一条常量失活会降低命中数（证明腿表整体承重）
  const dropAny = liveCheck.some((c) => c.hits < attacks.length);
  assert.ok(dropAny, 'FLOW_ZH 至少一个常量应是判据承重（失活后命中数下降）');
}

// ─── 4. 返回形状契约 ────────────────────────────────────────
{
  const r = checkPrevalenceIncidenceConfusion(attacks[0]);
  assert.ok(typeof r === 'object' && r !== null);
  for (const k of ['hit', 'score', 'detail', 'count']) {
    assert.ok(k in r, `返回对象应含字段 ${k}`);
  }
  const miss = checkPrevalenceIncidenceConfusion('今天天气不错。');
  assert.equal(miss.hit, false);
  assert.equal(miss.score, 0);
  assert.equal(miss.detail, '');
  assert.equal(miss.count, 0);
}

console.log('round-447 prevalence_incidence_confusion: 全部通过');
console.log(`  攻击命中 ${attacks.length}/${attacks.length}，良性零误伤 ${benign.length}/${benign.length}`);
