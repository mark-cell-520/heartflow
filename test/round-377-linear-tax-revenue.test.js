'use strict';
/**
 * test/round-377-linear-tax-revenue.test.js — r377「税率-税收线性误读」子族轮测
 *
 * 背景：r377 立项探针（scripts/round-377/probe-r377-pool.js 12 候选同池 +
 * probe-r377-scope.js D/F 二段深探）定拨 D_linear_tax_revenue：二段深探穿透
 * 7/10 真零命中（存量维度零覆盖）、良性 2/10 非 pass 均系存量
 * monocausal_attribution/pseudo_causal 误伤（非本族增量）。海外扫描空返
 * （两个 topic：arXiv OR 噪声 parse-fail / GitHub repos 0 / S2 429），按既有
 * 形态自建。子族聚合进 econ_reasoning_gate 单维度（src/index.js 零改动、
 * VERSION 不动），属真升级类型②（聚合族全新措辞家族）。
 *
 * 覆盖：A 模块层攻击/良性 → B 结构（双腿/豁免/守卫承重，20 组负例注入）→
 * C 引擎 gate 兑现 → D 插件层接线 → F 射程邻接核查（tax_incidence /
 * price_control 攻击集零交集）。
 */

const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const { detectLinearTaxRevenue, __internals } = require(path.join(ROOT, 'src', 'linear-tax-revenue.js'));
const gate = require(path.join(ROOT, 'src/econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src/plugins', 'econ-reasoning-check', 'index.js'));
const mainGate = require(path.join(ROOT, 'src/gate.js'));
const gcheck = mainGate.gate || mainGate.check;

let pass = 0, fail = 0;
function T(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const ATTACK = [
  '税率提高一倍，税收自然也会翻倍，财政收入立马宽裕。',
  '减税一半，财政收入就少一半，预算立刻紧张。',
  '只要把税率再往上提，税收就一定跟着按比例往上涨，库房肯定更充实。',
  '税率和税收是简单的正比例关系，加税筹钱永远按税率等比见效。',
  '把企业所得税从25%降到15%，财政收入就按四成折损，一分不多一分不少。',
  '提高烟草税三成，税收收入必然跟着涨三成，瘾君子该买还是会买。',
  '税负加重多少，入库的钱就增加多少，这笔账闭着眼睛都能算。',
  '随着税率下调，财政收入同步回落，库房马上见底。',
  'Doubling the tax rate will double the tax revenue the government collects.',
  'Halving the VAT rate will halve VAT receipts — the math is that simple.',
  'Tax cuts always cost the government exactly the rate cut times the current base.',
];
const BENIGN = [
  '税率与税收并非线性关系，超过临界点后提高税率反而可能因税基萎缩减少总收入。',
  '减税的影响取决于税基弹性，不能简单按税率比例折算财政收入变化。',
  '拉弗曲线描述税率与税收的非线性关系，具体位置取决于经济结构。',
  '在税基不变的简化假设下，税率提高会使税收同比例增加，这只是教科书推演。',
  '提高所得税率会减少劳动供给与企业投资，税基缩小会部分抵消税率效应。',
  '税收等于税率乘以税基，评估增税效果要看税基随税率的反应。',
  '减税可能通过刺激增长扩大税基，最终税收变化取决于两种效应的净结果。',
  '税制设计要权衡税率与税基，单一按比例折算财政收入会高估或低估政策效果。',
  '个人所得税专项附加扣除提高后，财政收入会有所减少，具体幅度取决于适用人数。',
  'The revenue effect of a rate change depends on how the tax base responds.',
  '税基对税率的反应会让财政收入偏离按比例折算的结果。',
  '对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。',
  '去年增值税收入翻了一番，主要是因为加强了征收管理。',
  '取消农业税后，农民负担明显减轻，乡村消费有所恢复。',
  'The Laffer curve shows that tax revenue moves in proportion to the tax rate only up to a point.',
  'If the tax base is held fixed, doubling the tax rate will double tax revenue.',
  'Tax revenue does not rise by the same proportion as the rate — the base adjusts.',
  'Revenue rising with the tax rate by the same percentage is a misconception.',
];

console.log('=== A 模块层：攻击命中 / 良性豁免 ===');
T('A1 11 条攻击全命中', () => {
  for (const t of ATTACK) assert.ok(detectLinearTaxRevenue(t).hit, '未命中: ' + t);
});
T('A2 18 条良性全豁免', () => {
  for (const t of BENIGN) assert.ok(!detectLinearTaxRevenue(t).hit, '误伤: ' + t);
});
T('A3 返回体字段齐备（dimension/severity/details/guidance）', () => {
  const r = detectLinearTaxRevenue(ATTACK[0]);
  assert.strictEqual(r.dimension, 'linear_tax_revenue');
  assert.ok(r.severity >= 60 && r.severity <= 100, 'severity=' + r.severity);
  assert.ok(r.details.includes('税率-税收线性误读'));
  assert.ok(r.guidance.includes('税基') && r.guidance.includes('拉弗曲线'));
});
T('A4 短文本/空文本守卫', () => {
  assert.strictEqual(detectLinearTaxRevenue('').hit, false);
  assert.strictEqual(detectLinearTaxRevenue(null).hit, false);
  assert.strictEqual(detectLinearTaxRevenue('税率').hit, false);
});

console.log('=== B 结构承重（双腿/豁免/守卫 20 组负例注入）===');
const NEVER = /(?!)/i;
T('B1 腿① RATE_ZH 删 → 「税率提高一倍…翻倍」不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[0], { RATE_ZH: [] }).hit);
});
T('B2 腿① RATE_ZH_B 删 → 「减税一半…少一半」不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[1], { RATE_ZH_B: [] }).hit);
});
T('B3 腿① RATE_ZH_C 删 → 「企业所得税从25%降到15%」句不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[4], { RATE_ZH_C: [] }).hit);
});
T('B4 腿② PROP_P1_ZH 删 → 「财政收入同步回落」句不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[7], { PROP_P1_ZH: [] }).hit);
});
T('B5 腿② PROP_P2_ZH 删 → 「正比例关系」句不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[3], { PROP_P2_ZH: [] }).hit);
});
T('B6 腿② PROP_P3_ZH 删 → 「税收自然也会翻倍」句不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[0], { PROP_P3_ZH: [] }).hit);
});
T('B7 腿② PROP_P4_ZH 删 → 「加重多少…增加多少」句不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[6], { PROP_P4_ZH: [] }).hit);
});
T('B8 腿① RATE_EN 删 → EN 攻击不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[8], { RATE_EN: [] }).hit);
});
T('B9 腿① RATE_EN_B 删 → EN tax cuts 攻击不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[10], { RATE_EN_B: [] }).hit);
});
T('B10 腿② PROP_E1_EN 删 → EN will double 攻击不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[8], { PROP_E1_EN: [] }).hit);
});
T('B11 腿② PROP_E3_EN 删 → EN exactly the rate 攻击不命中', () => {
  assert.ok(!detectLinearTaxRevenue(ATTACK[10], { PROP_E3_EN: [] }).hit);
});
T('B12 PAIR_ZH=0 → 远距两腿共现句不命中', () => {
  const t = '税率的任何变动都会牵动全局；说到底，税收跟着按比例走就是了。';
  assert.ok(detectLinearTaxRevenue(t).hit, '前提：远距句应命中');
  assert.ok(!detectLinearTaxRevenue(t, { PAIR_ZH: 0 }).hit);
});
T('B13 CONCEPT_ZH 删 → 拉弗曲线讨论句翻红（概念豁免承重）', () => {
  const t = '拉弗曲线表明，在超过临界点后，税收会随着税率的提高而减少。';
  assert.ok(!detectLinearTaxRevenue(t).hit);
  assert.ok(detectLinearTaxRevenue(t, { CONCEPT_ZH: NEVER }).hit);
});
T('B14 COND_ZH 删 → 条件句翻红（在…假设下豁免承重）', () => {
  const t = '在税基不变的简化假设下，税率提高会使税收同比例增加，这只是教科书推演。';
  assert.ok(!detectLinearTaxRevenue(t).hit);
  assert.ok(detectLinearTaxRevenue(t, { COND_ZH: NEVER }).hit);
});
T('B15 NEG_ZH 删 → 「税收翻倍」紧前否定句翻红（紧前否定守卫承重）', () => {
  const t = '税率提高不会带来税收翻倍，税基会缩小。';
  assert.ok(!detectLinearTaxRevenue(t).hit);
  assert.ok(detectLinearTaxRevenue(t, { NEG_ZH: NEVER }).hit);
});
T('B16 HEDGE_ZH 删 → 「按比例折算是想当然」句翻红（对冲短语守卫承重）', () => {
  const t = '税率按比例折算是想当然的简化，税基弹性会改变结果。';
  assert.ok(!detectLinearTaxRevenue(t).hit);
  assert.ok(detectLinearTaxRevenue(t, { HEDGE_ZH: NEVER }).hit);
});
T('B17 CONCEPT_EN 删 → EN Laffer 讨论句翻红', () => {
  const t = 'The Laffer curve shows that tax revenue moves in proportion to the tax rate only up to a point.';
  assert.ok(!detectLinearTaxRevenue(t).hit);
  assert.ok(detectLinearTaxRevenue(t, { CONCEPT_EN: NEVER }).hit);
});
T('B18 COND_EN 删 → EN 条件句翻红', () => {
  const t = 'If the tax base is held fixed, doubling the tax rate will double tax revenue.';
  assert.ok(!detectLinearTaxRevenue(t).hit);
  assert.ok(detectLinearTaxRevenue(t, { COND_EN: NEVER }).hit);
});
T('B19 NEG_EN 删 → EN 否定句翻红', () => {
  const t = 'Tax revenue does not rise by the same proportion as the tax rate — the base adjusts.';
  assert.ok(!detectLinearTaxRevenue(t).hit);
  assert.ok(detectLinearTaxRevenue(t, { NEG_EN: NEVER }).hit);
});
T('B20 HEDGE_EN 删 → EN misconception 句翻红', () => {
  const t = 'Revenue rising with the tax rate by the same percentage is a misconception.';
  assert.ok(!detectLinearTaxRevenue(t).hit);
  assert.ok(detectLinearTaxRevenue(t, { HEDGE_EN: NEVER }).hit);
});

console.log('=== C 引擎 gate 兑现 ===');
T('C1 攻击句 gate.action 非 pass 且归因 econ_reasoning_gate', () => {
  const r = gcheck(ATTACK[0]);
  const action = r.gate ? r.gate.action : r.action;
  assert.notStrictEqual(action, 'pass', 'action=' + action);
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('econ_reasoning_gate'), 'findings: [' + dims.join(',') + ']');
});
T('C2 gate 桥 families 含 linear_tax_revenue', () => {
  const g = gate.checkEconReasoningGate(ATTACK[0]);
  assert.ok(g.hit && g.families.some(f => f.key === 'linear_tax_revenue'));
});
T('C3 良性句 gate.action = pass', () => {
  const r = gcheck(BENIGN[0]);
  const action = r.gate ? r.gate.action : r.action;
  assert.strictEqual(action, 'pass', 'action=' + action);
});

console.log('=== D 插件层接线 ===');
T('D1 插件族表 47 族：36 econ + 11 stats，key 唯一', () => {
  assert.strictEqual(plugin.FAMILIES.length, 47);
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 36);
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11);
  const keys = plugin.FAMILIES.map(f => f.key);
  assert.strictEqual(new Set(keys).size, 47);
  assert.ok(keys.includes('linear_tax_revenue') && keys.includes('insurance_claim_loss') && keys.includes('flat_rate_bias'));
});
T('D2 插件 version 1.19.0（r386 再 bump）', () => {
  assert.strictEqual(plugin.version, '1.23.0');
});
T('D3 gate 桥族表 42 族', () => {
  assert.strictEqual(gate.FAMILIES.length, 42);
});

console.log('=== F 射程邻接核查 ===');
T('F1 tax_incidence 攻击句不误触 linear_tax_revenue', () => {
  const g = gate.checkEconReasoningGate('对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。');
  assert.ok(!g.families.some(f => f.key === 'linear_tax_revenue'));
});
T('F2 price_control 攻击句不误触 linear_tax_revenue', () => {
  const g = gate.checkEconReasoningGate('房租上限只会让租房变得更便宜，不会有什么副作用。');
  assert.ok(!g.families.some(f => f.key === 'linear_tax_revenue'));
});
T('F3 本族攻击句不被 tax_incidence 模块命中（射程零交集双向）', () => {
  const { detectTaxIncidence } = require(path.join(ROOT, 'src', 'tax-incidence.js'));
  for (const t of ATTACK) assert.ok(!detectTaxIncidence(t).hit, 'tax_incidence 误命中: ' + t);
});
T('F4 本族良性句不被 tax_incidence 误判（互补不重叠；tax_incidence 自身攻击样本除外）', () => {
  const { detectTaxIncidence } = require(path.join(ROOT, 'src', 'tax-incidence.js'));
  const taxAtk = '对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。';
  for (const t of BENIGN) {
    if (t === taxAtk) continue; // 该句是 tax_incidence 的攻击样本，其命中属本职
    assert.ok(!detectTaxIncidence(t).hit, 'tax_incidence 误伤: ' + t);
  }
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
