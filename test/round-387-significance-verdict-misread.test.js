/**
 * test/round-387-significance-verdict-misread.test.js
 * r387 显著性裁定误读（significance_verdict_misread）轮测：
 *   A 模块级攻击命中（两子族 ZH/EN 全覆盖）
 *   B 模块级良性零误伤（含射程邻接族不误判）
 *   C 注入-删条负例（逐条删掉本轮新模式，断言守卫必须变红——断言失败而非加载崩溃）
 *   D gate 层归因（action 非 pass 且 findings 含 econ_reasoning_gate）
 *   E 存量计数链同步（econ 族数 38→39 / 插件 43→44；r389 再同步 39→41 / 44→46）
 */
'use strict';
const assert = require('assert');
const { test } = require('node:test');
const { detectSignificanceVerdictMisread, __internals } = require('../src/significance-verdict-misread.js');
const gate = require('../src/gate.js').gate;
const I = __internals();

// ─── A 攻击（子族 1 边缘显著→效应存在 / 子族 2 不显著→无效应）──
const ATTACK_SUB1_ZH = [
  '结果接近显著水平（p = 0.06），说明干预措施确实有效。',
  '该效应呈现边缘显著的趋势，可以认为处理组更优。',
  'p 值达到 0.07，已经接近统计显著，我们有理由相信存在真实效应。',
  '差异虽未达显著，但已接近显著阈值，方向符合预期。',
  '统计上勉强接近显著水平，这提示治疗可能改善预后。',
  '结果处于显著性的边缘，基本可以认定新方法更好。',
  '两组差异趋向显著，趋势明确，说明方案有效。',
  '检验结果接近 0.05 的临界值，效应方向与假设一致，可以采信。',
  '疗效差异接近统计学意义，可以认为新药优于安慰剂。',
  '该指标几乎达到显著水平，说明策略确实起了作用。',
];
const ATTACK_SUB1_EN = [
  'The result approached significance (p = 0.06), showing the intervention works.',
  'The effect showed a borderline significant trend, so the treatment group can be considered superior.',
  'At p = 0.07 the finding approaches statistical significance, giving us reason to believe a real effect exists.',
  'The difference was marginally significant and in the expected direction.',
  'Results hovered on the brink of significance, essentially confirming the hypothesis.',
  'The trend approached significance, indicating a clear effect of the policy.',
  'The finding fell just short of significance but the direction supports our theory.',
  'A definite trend toward significance was observed, so the effect is real.',
  'The effect was close to significance, which supports our hypothesis.',
  'A marginal trend toward significance suggests the program is effective.',
];
const ATTACK_SUB2_ZH = [
  'p 值大于 0.05，说明两组之间没有差异，该药物无效。',
  '差异不显著，证明这个因素没有影响，可以排除。',
  '统计检验未达显著，说明两者之间不存在关系。',
  '结果不显著，因此该干预没有任何效果。',
  'p = 0.32 表明变量之间毫无关联，假设被否定。',
  '检验不显著，说明暴露与结局之间没有联系，无需进一步研究。',
  '不显著即无效：该疗法对存活率没有作用。',
  '由于 p 值不显著，我们可以断定不存在效应。',
  'p 值未达显著，证明疫苗不能预防感染。',
  '检验结果不显著，说明该方法没有效果，应当放弃。',
];
const ATTACK_SUB2_EN = [
  'p > 0.05, so there is no difference between the two groups and the drug does not work.',
  'The difference was not significant, proving this factor has no effect and can be ruled out.',
  'The test was not significant, showing there is no relationship between the two variables.',
  'The result was not significant, so the intervention had no effect whatsoever.',
  'p = 0.32 indicates no association between the variables, so the hypothesis is refuted.',
  'Because the test was not significant we can conclude there is no effect.',
  'The p-value exceeded 0.05, demonstrating that the treatment is ineffective.',
  'No significant difference was found, so the policy has no impact.',
];

// ─── B 良性（正当报告 / 概念教学 / 正确对冲 / 并列实测 / 射程邻接）──
const BENIGN = [
  '本次检验 p=0.12 未达显著，我们将其报告为不确定，不下任何效应结论。',
  '两组差异在统计学上不显著，这一结果提示需要更大样本的重复试验。',
  'The result was not significant and we report it as inconclusive.',
  'No significant difference was detected, so we planned a larger replication study.',
  'p = 0.06 未过线，本次检验未能拒绝原假设。',
  'The test failed to reach significance, so we cannot conclude that the treatment works.',
  '不显著不等于没有效应，功效不足时真实差异同样检不出来。',
  '边缘显著是一种常见的措辞包装，不等于结果真的接近显著。',
  'Not significant does not mean there is no effect — this is a common misconception.',
  'Borderline significance is a weasel word that researchers use to dress up a failed test.',
  '把「趋向显著」讲成「效应存在」是统计误读。',
  'A trend toward significance is not evidence that the effect is real.',
  '检验不显著，我们不能据此断定该药物没有效果。',
  '结果未达显著，但不足以证明无效，检验效能有限。',
  'The difference was not significant, but we cannot conclude there is no effect.',
  'The test was underpowered, so failure to reach significance proves nothing.',
  '试验未达主要终点：p=0.12；两组生存率 60% 对 58%。',
  'The trial missed its primary endpoint: p = 0.12; survival 60% vs 58%.',
  '边缘显著只说明证据不足，不代表效应存在。',
  'Approaching significance only means the evidence was insufficient, not that an effect exists.',
  // 射程邻接族（不应误判）
  'p 值小于 0.05，所以这个效应在现实中也一定很重要。',
  '研究中相对风险下降了三成，所以你个人的绝对风险一定也下降三成。',
  '测试全跑过了没报错，所以代码肯定没问题。',
  '确诊人数比去年翻了一倍，所以发病率也翻了一倍。',
];

test('r387 A 子族1 边缘显著→效应存在：ZH 10 + EN 10 全命中', () => {
  for (const t of ATTACK_SUB1_ZH) {
    const r = detectSignificanceVerdictMisread(t);
    assert.ok(r.hit, '应命中: ' + t);
    assert.strictEqual(r.sub, 'borderline_significance');
    assert.ok(r.score >= 0.6);
    assert.ok(r.guidance && r.guidance.length > 50, 'guidance 须非空');
  }
  for (const t of ATTACK_SUB1_EN) {
    const r = detectSignificanceVerdictMisread(t);
    assert.ok(r.hit, '应命中: ' + t);
    assert.strictEqual(r.sub, 'borderline_significance');
  }
});

test('r387 A 子族2 不显著→无效应：ZH 10 + EN 8 全命中', () => {
  for (const t of ATTACK_SUB2_ZH) {
    const r = detectSignificanceVerdictMisread(t);
    assert.ok(r.hit, '应命中: ' + t);
    assert.strictEqual(r.sub, 'nonsignificant_no_effect');
  }
  for (const t of ATTACK_SUB2_EN) {
    const r = detectSignificanceVerdictMisread(t);
    assert.ok(r.hit, '应命中: ' + t);
    assert.strictEqual(r.sub, 'nonsignificant_no_effect');
  }
});

test('r387 B 良性零误伤（24 条）', () => {
  for (const t of BENIGN) {
    assert.ok(!detectSignificanceVerdictMisread(t).hit, '不应命中: ' + t);
  }
});

// ─── C 注入-删条负例 ───
function nullify(keys) { const o = {}; for (const k of keys) o[k] = /(?!)/i; return o; }
const LEG1_A = ['BORDER_ZH', 'BORDER_EN'], LEG2_A = ['CLAIM_ZH', 'CLAIM_EN'];
const LEG1_B = ['NONSIG_ZH', 'NONSIG_EN', 'PVALUE_ZH', 'PVALUE_EN'], LEG2_B = ['NOEFFECT_ZH', 'NOEFFECT_EN'];
const PA = ATTACK_SUB1_ZH[0], PB = ATTACK_SUB2_ZH[0];

test('r387 C1 删 子族1 腿①a BORDER → 断言变红（非崩溃）', () => {
  const r = detectSignificanceVerdictMisread(PA, nullify(LEG1_A));
  assert.ok(!r.hit);
});
test('r387 C2 删 子族1 腿②a CLAIM → 断言变红（非崩溃）', () => {
  assert.ok(!detectSignificanceVerdictMisread(PA, nullify(LEG2_A)).hit);
});
test('r387 C3 删 子族2 腿①b NONSIG+PVALUE → 断言变红（非崩溃）', () => {
  assert.ok(!detectSignificanceVerdictMisread(PB, nullify(LEG1_B)).hit);
});
test('r387 C4 删 子族2 腿②b NOEFFECT → 断言变红（非崩溃）', () => {
  assert.ok(!detectSignificanceVerdictMisread(PB, nullify(LEG2_B)).hit);
});
test('r387 C5 删 推断标记 → 两子族均死', () => {
  const inj = nullify(['INFER_ZH', 'INFER_EN']);
  assert.ok(!detectSignificanceVerdictMisread(PA, inj).hit);
  assert.ok(!detectSignificanceVerdictMisread(PB, inj).hit);
});
test('r387 C6 窗收紧 WINDOW_ZH=0 → 死', () => {
  assert.ok(!detectSignificanceVerdictMisread(PA, { WINDOW_ZH: 0, WINDOW_EN: 0 }).hit);
});
test('r387 C7-C10 分锚隔离：删一边锚不误杀另一边', () => {
  assert.ok(detectSignificanceVerdictMisread(PB, nullify(LEG1_A)).hit, '删 BORDER 不误伤子族2');
  assert.ok(detectSignificanceVerdictMisread(PA, nullify(LEG1_B)).hit, '删 NONSIG 不误伤子族1');
  assert.ok(detectSignificanceVerdictMisread(PB, nullify(LEG2_A)).hit, '删 CLAIM 不误伤子族2');
  assert.ok(detectSignificanceVerdictMisread(PA, nullify(LEG2_B)).hit, '删 NOEFFECT 不误伤子族1');
});
test('r387 C11 腿②紧前否定窗承重（并非更好）', () => {
  assert.ok(!detectSignificanceVerdictMisread('差异虽未达显著，但已接近显著阈值，说明结果并非更好。').hit);
});
test('r387 C12 CONCEPT 豁免承重（默认豁免 ∧ 注入后转命中）', () => {
  const s = '不显著不等于没有效应；p>0.05 说明没有差异';
  assert.ok(!detectSignificanceVerdictMisread(s).hit);
  assert.ok(detectSignificanceVerdictMisread(s, nullify(['CONCEPT_ZH'])).hit);
});
test('r387 C13 CORRECT 豁免承重（默认豁免 ∧ 注入后转命中）', () => {
  const s = '结果未达显著，我们不能据此断定该药物没有效果。';
  assert.ok(!detectSignificanceVerdictMisread(s).hit);
  assert.ok(detectSignificanceVerdictMisread(s, nullify(['CORRECT_ZH'])).hit);
});
test('r387 C14 p 值数值过滤：p=0.03（显著）不作不显著锚', () => {
  assert.ok(!detectSignificanceVerdictMisread('p = 0.03，说明两组之间没有差异。').hit);
});

// ─── D gate 层归因 ───
test('r387 D gate 层 38 条全非 pass 且归因 econ_reasoning_gate', () => {
  const all = [...ATTACK_SUB1_ZH, ...ATTACK_SUB1_EN, ...ATTACK_SUB2_ZH, ...ATTACK_SUB2_EN];
  for (const t of all) {
    const r = gate(t);
    const act = r.gate ? r.gate.action : r.action;
    const dims = (r.findings || []).map(f => f.dimension);
    assert.notStrictEqual(act, 'pass', 'gate action 应为非 pass: ' + t);
    assert.ok(dims.includes('econ_reasoning_gate'), 'findings 应含 econ_reasoning_gate: ' + t + ' | ' + JSON.stringify(dims));
  }
});

test('r387 D2 gate 层良性对照零归因', () => {
  for (const t of BENIGN) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (dims.includes('econ_reasoning_gate')) {
      assert.ok(!detectSignificanceVerdictMisread(t).hit, '本族不应在良性句上归因: ' + t);
    }
  }
});

// ─── E 存量计数链同步 ───
test('r387 E econ gate 族数 41 / 插件族数 46（36 econ + 10 stats）', () => {
  const g = require('../src/econ-reasoning-gate.js');
  const fams = g.FAMILIES;
  assert.ok(Array.isArray(fams) && fams.length === 41, 'econ gate FAMILIES 应为 41，实测 ' + (fams && fams.length));
  assert.ok(fams.some(f => f.key === 'significance_verdict_misread'), '应含 significance_verdict_misread');

  const plugin = require('../src/plugins/econ-reasoning-check/index.js');
  const pfams = plugin.FAMILIES;
  assert.ok(Array.isArray(pfams) && pfams.length === 46, '插件 FAMILIES 应为 46，实测 ' + (pfams && pfams.length));
  const stats = pfams.filter(f => f.group === 'stats');
  const econ = pfams.filter(f => f.group === 'econ');
  assert.strictEqual(stats.length, 10, 'stats 组应为 10，实测 ' + stats.length);
  assert.strictEqual(econ.length, 36, 'econ 组应为 36，实测 ' + econ.length);
  assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.22.0，实测 ' + plugin.version);
});
