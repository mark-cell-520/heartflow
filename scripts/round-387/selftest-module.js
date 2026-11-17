/**
 * scripts/round-387/selftest-module.js — r387 显著性裁定误读模块级自测
 * A 攻击命中（两子族全覆盖）｜B 良性零误伤｜C 豁免承重
 */
'use strict';
const { detectSignificanceVerdictMisread, __internals } = require('../../src/significance-verdict-misread.js');

const ATTACK_A = [ // 子族 1 边缘显著→效应存在
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
const ATTACK_A_EN = [
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
const ATTACK_B = [ // 子族 2 不显著→无效应
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
const ATTACK_B_EN = [
  'p > 0.05, so there is no difference between the two groups and the drug does not work.',
  'The difference was not significant, proving this factor has no effect and can be ruled out.',
  'The test was not significant, showing there is no relationship between the two variables.',
  'The result was not significant, so the intervention had no effect whatsoever.',
  'p = 0.32 indicates no association between the variables, so the hypothesis is refuted.',
  'Because the test was not significant we can conclude there is no effect.',
  'The p-value exceeded 0.05, demonstrating that the treatment is ineffective.',
  'No significant difference was found, so the policy has no impact.',
];

const BENIGN = [
  // 正当报告句（腿②缺失）
  '本次检验 p=0.12 未达显著，我们将其报告为不确定，不下任何效应结论。',
  '两组差异在统计学上不显著，这一结果提示需要更大样本的重复试验。',
  'The result was not significant and we report it as inconclusive.',
  'No significant difference was detected, so we planned a larger replication study.',
  'p = 0.06 未过线，本次检验未能拒绝原假设。',
  'The test failed to reach significance, so we cannot conclude that the treatment works.',
  // 概念教学（CONCEPT 豁免）
  '不显著不等于没有效应，功效不足时真实差异同样检不出来。',
  '边缘显著是一种常见的措辞包装，不等于结果真的接近显著。',
  'Not significant does not mean there is no effect — this is a common misconception.',
  'Borderline significance is a weasel word that researchers use to dress up a failed test.',
  '把「趋向显著」讲成「效应存在」是统计误读。',
  'A trend toward significance is not evidence that the effect is real.',
  // 正确对冲（CORRECT 豁免）
  '检验不显著，我们不能断定没有效应，可能是样本量不足。',
  '结果未达显著，但不足以证明无效，检验效能有限。',
  'The difference was not significant, but we cannot conclude there is no effect.',
  'The test was underpowered, so failure to reach significance proves nothing.',
  // 并列实测发现（无推断标记）
  '试验未达主要终点：p=0.12；两组生存率 60% 对 58%。',
  'The trial missed its primary endpoint: p = 0.12; survival 60% vs 58%.',
  // 限定性前缀
  '边缘显著只说明证据不足，不代表效应存在。',
  'Approaching significance only means the evidence was insufficient, not that an effect exists.',
  // 射程邻接（不应命中）
  'p 值小于 0.05，所以这个效应在现实中也一定很重要。',              // significance_effect_size
  '研究中相对风险下降了三成，所以你个人的绝对风险一定也下降三成。',  // relative_risk_individual_transfer
  '测试全跑过了没报错，所以代码肯定没问题。',                        // absence_of_problems
  '确诊人数比去年翻了一倍，所以发病率也翻了一倍。',                  // count_rate_conflation
];

let fail = 0;
console.log('=== A 模块级攻击命中（子族1 ZH 10 / EN 10，子族2 ZH 10 / EN 8）===');
const A1 = ATTACK_A, A2 = ATTACK_A_EN, A3 = ATTACK_B, A4 = ATTACK_B_EN;
for (const [name, arr, sub] of [['A1 子族1 ZH', A1, 'borderline_significance'], ['A2 子族1 EN', A2, 'borderline_significance'], ['A3 子族2 ZH', A3, 'nonsignificant_no_effect'], ['A4 子族2 EN', A4, 'nonsignificant_no_effect']]) {
  let ok = 0;
  for (const t of arr) {
    const r = detectSignificanceVerdictMisread(t);
    if (r.hit && r.sub === sub && r.score >= 0.6) ok++;
    else console.log('  MISS [' + name + '] sub=' + r.sub + ' hit=' + r.hit + ' | ' + t.slice(0, 50));
  }
  console.log('  ' + name + ': ' + ok + '/' + arr.length);
  if (ok !== arr.length) fail++;
}
console.log('\n=== B 模块级良性零误伤（' + BENIGN.length + ' 条）===');
let fp = [];
for (const b of BENIGN) { if (detectSignificanceVerdictMisread(b).hit) fp.push(b.slice(0, 40)); }
console.log('  误命中 ' + fp.length + '/' + BENIGN.length + (fp.length ? ':\n   ' + fp.join('\n   ') : ''));
if (fp.length > 0) fail++;

console.log('\n=== C 负例注入-删条（承重证明）===');
const I = __internals();
function nullify(keys) { const o = {}; for (const k of keys) o[k] = /(?!)/i; return o; }
const LEG1_A = ['BORDER_ZH', 'BORDER_EN'], LEG2_A = ['CLAIM_ZH', 'CLAIM_EN'];
const LEG1_B = ['NONSIG_ZH', 'NONSIG_EN', 'PVALUE_ZH', 'PVALUE_EN'], LEG2_B = ['NOEFFECT_ZH', 'NOEFFECT_EN'];
const PA = A1[0], PB = A3[0];
const c = [];
c.push(['C1 子族1 腿①a BORDER 注入 → 死', !detectSignificanceVerdictMisread(PA, nullify(LEG1_A)).hit]);
c.push(['C2 子族1 腿②a CLAIM 注入 → 死', !detectSignificanceVerdictMisread(PA, nullify(LEG2_A)).hit]);
c.push(['C3 子族2 腿①b NONSIG+PVALUE 注入 → 死', !detectSignificanceVerdictMisread(PB, nullify(LEG1_B)).hit]);
c.push(['C4 子族2 腿②b NOEFFECT 注入 → 死', !detectSignificanceVerdictMisread(PB, nullify(LEG2_B)).hit]);
c.push(['C5 推断标记注入 → 两子族死',
  !detectSignificanceVerdictMisread(PA, nullify(['INFER_ZH', 'INFER_EN'])).hit &&
  !detectSignificanceVerdictMisread(PB, nullify(['INFER_ZH', 'INFER_EN'])).hit]);
c.push(['C6 窗收紧（WINDOW_ZH=0）→ 死', !detectSignificanceVerdictMisread(PA, { WINDOW_ZH: 0, WINDOW_EN: 0 }).hit]);
// 分锚隔离：删子族1 锚不应误杀子族2
c.push(['C7 删 BORDER 不误伤子族2', detectSignificanceVerdictMisread(PB, nullify(LEG1_A)).hit]);
c.push(['C8 删 NONSIG 不误伤子族1', detectSignificanceVerdictMisread(PA, nullify(LEG1_B)).hit]);
c.push(['C9 删 CLAIM 不误伤子族2', detectSignificanceVerdictMisread(PB, nullify(LEG2_A)).hit]);
c.push(['C10 删 NOEFFECT 不误伤子族1', detectSignificanceVerdictMisread(PA, nullify(LEG2_B)).hit]);
// 腿②守卫承重（紧前否定窗）
c.push(['C11 腿②紧前否定窗承重（并非更好）',
  !detectSignificanceVerdictMisread('差异虽未达显著，但已接近显著阈值，说明结果并非更好。').hit]);
// 豁免承重
const PROOF_CONCEPT = ['概念讨论承重', '不显著不等于没有效应；p>0.05 说明没有差异'];
const PROOF_CORRECT = ['对冲承重', '结果未达显著，我们不能据此断定该药物没有效果。'];
for (const [label, s] of [PROOF_CONCEPT, PROOF_CORRECT]) {
  const key = label === '概念讨论承重' ? 'CONCEPT_ZH' : 'CORRECT_ZH';
  const before = detectSignificanceVerdictMisread(s).hit;
  const after = detectSignificanceVerdictMisread(s, nullify([key])).hit;
  c.push([label + '：默认豁免 ∧ 注入后转命中', !before && after]);
}
for (const [n, ok] of c) { console.log('  ' + (ok ? '✓ ' : '✗ ') + n); if (!ok) fail++; }

console.log('\n=== 汇总：' + (fail === 0 ? '全部通过' : '失败 ' + fail + ' 项') + ' ===');
process.exit(fail === 0 ? 0 : 1);
