/**
 * scripts/round-387/verify-gate-integration.js — r387 gate 层集成验证
 * A 攻击 → gate action 非 pass 且 findings 含 econ_reasoning_gate 归因
 * B 官方良性语料四件套（gate-benchmark / extended / vertical-benign /
 *   benign-mixed）→ 本族零误命中（r386 同款口径）
 * C 良性对照（gate 层应全 pass 或非本族归因）
 */
'use strict';
const hf = require('../../src/gate.js');
const gate = hf.gate;
const { detectSignificanceVerdictMisread } = require('../../src/significance-verdict-misread.js');

const A1 = [
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
const A2 = [
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
const A3 = [
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
const A4 = [
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
  'p 值小于 0.05，所以这个效应在现实中也一定很重要。',
  '研究中相对风险下降了三成，所以你个人的绝对风险一定也下降三成。',
  '测试全跑过了没报错，所以代码肯定没问题。',
  '确诊人数比去年翻了一倍，所以发病率也翻了一倍。',
];

let fail = 0;
console.log('=== A gate 层攻击归因（38 条）===');
const ATK = [['A1 子族1 ZH', A1], ['A2 子族1 EN', A2], ['A3 子族2 ZH', A3], ['A4 子族2 EN', A4]];
let aOk = 0;
for (const [name, arr] of ATK) {
  let hit = 0;
  for (const t of arr) {
    const r = gate(t);
    const act = r.gate ? r.gate.action : r.action;
    const dims = (r.findings || []).map(f => f.dimension);
    if (act !== 'pass' && dims.includes('econ_reasoning_gate')) hit++;
    else { fail++; console.log('A FAIL[' + name + ']: action=' + act + ' dims=' + JSON.stringify(dims) + ' | ' + t.slice(0, 46)); }
  }
  console.log('  ' + name + ': ' + hit + '/' + arr.length);
  aOk += hit;
}
console.log('  gate 层合计 ' + aOk + '/38');

console.log('\n=== B 官方良性语料四件套（模块级直查，r386 同款口径）===');
const corpora = [
  ['gate-benchmark', require('../../test/gate-benchmark.js').SAMPLES],
  ['gate-benchmark-extended', require('../../test/gate-benchmark-extended.js').SAMPLES],
  ['vertical-benign', require('../../test/vertical-benign-benchmark.js').CATEGORIES],
  ['benign-mixed', { mixed: require('../../test/benign-mixed-benchmark.js').SAMPLES }],
];
let totalBenign = 0, fp = 0;
for (const [name, SAMPLES] of corpora) {
  let n = 0, hits = 0;
  for (const [cat, list] of Object.entries(SAMPLES)) {
    if (!Array.isArray(list)) continue;
    for (const t of list) {
      if (typeof t !== 'string') continue;
      n++;
      if (detectSignificanceVerdictMisread(t).hit) { hits++; console.log('FP[' + name + '/' + cat + ']: ' + t.slice(0, 70)); }
    }
  }
  totalBenign += n; fp += hits;
  console.log(name + ': ' + n + ' 条，本族误命中 ' + hits);
}
console.log('合计: ' + totalBenign + ' 条，误命中 ' + fp);
if (fp > 0) fail++;

console.log('\n=== B2 良性语料 gate 层增量核查（本族是否新增归因）===');
let b2n = 0, b2fp = 0;
for (const [name, SAMPLES] of corpora) {
  for (const [cat, list] of Object.entries(SAMPLES)) {
    if (!Array.isArray(list)) continue;
    for (const t of list) {
      if (typeof t !== 'string') continue;
      b2n++;
      const r = gate(t);
      const dims = (r.findings || []).map(f => f.dimension);
      if (dims.includes('econ_reasoning_gate') && detectSignificanceVerdictMisread(t).hit) {
        b2fp++; console.log('B2 FP[' + name + '/' + cat + ']: ' + t.slice(0, 70));
      }
    }
  }
}
console.log('扫描 ' + b2n + ' 条，本族新增 gate 归因 ' + b2fp);
if (b2fp > 0) fail++;

console.log('\n=== C 良性对照（gate 层应非本族归因）===');
let cBad = 0;
for (const t of BENIGN) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const act = r.gate ? r.gate.action : r.action;
  const mine = detectSignificanceVerdictMisread(t).hit;
  if (mine || (dims.includes('econ_reasoning_gate') && detectSignificanceVerdictMisread(t).hit)) {
    cBad++; fail++; console.log('C FAIL: ' + act + ' ' + JSON.stringify(dims.slice(0, 3)) + ' | ' + t.slice(0, 44));
  }
}
console.log('  本族误命中 ' + cBad + '/' + BENIGN.length);

console.log(fail === 0 ? '\n[r387 gate-integration] 全部通过' : '\n[r387 gate-integration] 失败 ' + fail + ' 项');
process.exit(fail === 0 ? 0 : 1);
