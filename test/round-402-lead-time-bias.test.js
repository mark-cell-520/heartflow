'use strict';
// r402 轮测：第 270 维度 lead_time_bias（领先时间偏误）
// r403 接手补建——src/index.js 的 lead_time_bias 接线注释引用了本文件，
// 但 r402 起草时未随接线提交，测试缺失。本文件按同族轮测形态补齐：
// 攻击变体矩阵（同族 ≥5 变体：中英双语、裸名词、带修饰、倒装、长句）
// + 良性矩阵（≥5，含边缘良性）+ 负例注入逐常量承重验证。
const { test } = require('node:test');
const assert = require('node:assert');
const { gate } = require('../src/gate.js');
const { checkLeadTimeBias, __internals } = require('../src/lead-time-bias.js');

// ─── 攻击矩阵：三腿齐备（筛查语义 × 诊断时点前移 × 生存获益）──────────
const ATTACKS = [
  // 1 标准形（显式提前）
  '由于普查让确诊时间提前了两年，患者的平均生存时间从2年延长到了5年。',
  // 2 裸主语倒装（结论在前）
  '患者的生存期明显变长了，因为普查让我们更早发现了癌症。',
  // 3 筛查引入时点族（r403 补：TIMING 腿「自从…筛查以来」）
  '自从社区推广低价钼靶筛查以来，乳腺癌患者从确诊开始计算的中位生存时间由4年提高到了7年以上，可见早期筛查实实在在延长了患者的寿命。',
  // 4 EN 标准形
  'Screening advanced the date of diagnosis by two years, so patients appeared to live longer.',
  // 5 EN 裸 smaller + survive longer（r403 补）
  'Tumors found by screening are smaller and patients survive longer.',
  // 6 EN survival rate has improved 无前移词形（r403 补）
  'Because cancer is detected earlier now, the five-year survival rate has improved significantly.',
  // 7 认知框架形（r403 补：「显得更长」）
  '筛查普及后，肿瘤能更早被发现，患者的生存期因此显得更长。',
];

// ─── 良性矩阵：含边缘良性 ────────────────────────────────────────────
const BENIGNS = [
  // 硬终点豁免（ mortality 口径）
  '筛查能更早发现问题，但能否延长寿命还需要随机对照试验的死亡率数据来回答。',
  // 无获益断言
  '开展癌症筛查项目有助于实现早诊早治。',
  // 治愈率口径（机制性获益）
  '早期发现可以提高治愈机会，这是筛查的公认价值。',
  // EN 硬终点
  'Screening can detect cancer earlier, though whether it reduces mortality requires RCT evidence.',
  // 元陈述破除本谬误
  'Early diagnosis alone does not prove longer survival; lead-time bias must be considered.',
  // 边缘良性：历史治疗进步对比（无筛查/无诊断起点前移）
  '这个病现在确诊后平均能活8年，而几十年前只能活3年，医学进步真大。',
  // 边缘良性：硬终点数据
  '大规模随机对照试验显示，筛查组的癌症死亡率显著下降。',
];

test('lead_time_bias 攻击矩阵：模块层全部命中', () => {
  for (const a of ATTACKS) {
    const r = checkLeadTimeBias(a);
    assert.ok(r.hit, `漏判: ${a} → ${JSON.stringify(r)}`);
  }
});

test('lead_time_bias 攻击矩阵：gate 层全部拦下（action 非 pass）', () => {
  for (const a of ATTACKS) {
    const g = gate(a);
    assert.notStrictEqual(g.gate.action, 'pass', `gate 放行: ${a} → ${JSON.stringify(g.gate)}`);
  }
});

test('lead_time_bias 良性矩阵：模块层全部零命中', () => {
  for (const b of BENIGNS) {
    const r = checkLeadTimeBias(b);
    assert.ok(!r.hit, `误伤: ${b} → ${JSON.stringify(r.detail)}`);
  }
});

test('lead_time_bias 良性矩阵：gate 层全部 pass 或单维不承重', () => {
  for (const b of BENIGNS) {
    const g = gate(b);
    const dims = (g.findings || []).map((f) => f.dimension);
    assert.ok(
      g.gate.action === 'pass' || !dims.includes('lead_time_bias'),
      `良性句被 lead_time_bias 承重: ${b} → action=${g.gate.action}, dims=${dims.join(',')}`
    );
  }
});

// ─── 负例注入逐常量承重验证 ─────────────────────────────────────────
// 每条攻击句逐腿注入空数组，验证三腿各自承重（去掉任一脚即不判）
const I = __internals();

test('lead_time_bias 承重验证：逐腿注入空数组攻击即失配', () => {
  // 攻击 3（中文长句）三腿齐备，逐腿剔除
  const s = ATTACKS[2];
  const base = checkLeadTimeBias(s);
  assert.ok(base.hit, '基线应命中');
  assert.ok(!checkLeadTimeBias(s, { TIMING_ZH: [] }).hit, '剔除 TIMING_ZH 应失配');
  assert.ok(!checkLeadTimeBias(s, { SCREENING_ZH: [] }).hit, '剔除 SCREENING_ZH 应失配');
  assert.ok(!checkLeadTimeBias(s, { GAIN_ZH: [] }).hit, '剔除 GAIN_ZH 应失配');
  // 攻击 6（EN）同样验证
  const s6 = ATTACKS[5];
  assert.ok(checkLeadTimeBias(s6).hit, 'EN 基线应命中');
  assert.ok(!checkLeadTimeBias(s6, { TIMING_EN: [] }).hit, '剔除 TIMING_EN 应失配');
  assert.ok(!checkLeadTimeBias(s6, { SCREENING_EN: [] }).hit, '剔除 SCREENING_EN 应失配');
  assert.ok(!checkLeadTimeBias(s6, { GAIN_EN: [] }).hit, '剔除 GAIN_EN 应失配');
});

test('lead_time_bias 负例注入：豁免表逐项承重', () => {
  // 用含死亡率表述的良性句验证豁免表承重：注入空 EXEMPT_ENDPOINT_ZH
  // 后该良性句应转为命中（证明豁免常量正是它不被判的原因），注入原始
  // 常量恢复放行——逐常量证明豁免腿真实承重。
  const benign = BENIGNS[0]; // 「…还需要随机对照试验的死亡率数据来回答。」
  assert.ok(!checkLeadTimeBias(benign).hit, '原始豁免表下良性句应放行');
  assert.ok(checkLeadTimeBias(benign, { EXEMPT_ENDPOINT_ZH: [], EXEMPT_ENDPOINT_EN: [] }).hit,
    '剔除死亡率豁免形后良性句应转为命中（证明豁免承重）');
  // 攻击句反向验证：注入死亡率豁免形不应放行不含死亡率表述的攻击句
  const s = ATTACKS[0];
  assert.ok(checkLeadTimeBias(s).hit, '攻击基线应命中');
  assert.ok(checkLeadTimeBias(s, { EXEMPT_ENDPOINT_ZH: [/死亡率|病死率|死亡风险/] }).hit,
    '攻击句不含死亡率词，注入豁免形不应生效');
});

test('lead_time_bias 注册完整性：VERIFY 级在 index 接线', () => {
  const idx = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(idx.includes("'lead_time_bias'"), 'index.js 应含 lead_time_bias 注册');
  assert.ok(idx.includes('lead-time-bias'), 'index.js 应 require lead-time-bias 模块');
});
