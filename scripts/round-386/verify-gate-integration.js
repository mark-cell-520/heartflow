/**
 * scripts/round-386/verify-gate-integration.js — r386 gate 层集成验证
 * A 攻击 → gate action 非 pass 且 findings 含 econ_reasoning_gate/effect_measure_misread 归因
 * B 官方良性语料四件套（gate-benchmark / extended / vertical-benign / benign-mixed）→
 *   本模块零误命中（effect_measure_misread 不在 findings dims）
 */
'use strict';
const hf = require('../../src/gate.js');
const gate = hf.gate;
const { detectEffectMeasureMisread } = require('../../src/effect-measure-misread.js');

const ATTACK = [
  'OR=1.5 就代表风险只上升五成，这个因素不值得担心。',
  'logistic 回归显示 OR 为 3.2，说明服药者患病的风险是普通人的 3.2 倍。',
  '病例对照研究的 OR 达到 4，这意味着暴露组的发病概率是对照组的 4 倍。',
  '风险比降到 0.5，等于患者活过五年的概率翻倍。',
  '风险比 HR=0.7，说明新药把五年生存率从 50% 提高到了 85%。',
  '新药的风险比为 0.8，意味着患者的生存率将提高 15 个百分点。',
  'An OR of 4 means the probability of disease is four times higher.',
  'The odds ratio was 3.2, so the exposed group has 3.2 times the risk.',
  'A hazard ratio of 0.7 means five-year survival improved by 30 percentage points.',
  'HR = 0.5 means the probability of surviving five years is doubled.',
];
const BENIGN = [
  'HR=0.7 说明死亡风险下降三成，这是相对风险的改善。',
  'OR 为 2.4，说明病例组的暴露比值是对照组的 2.4 倍。',
  'The hazard ratio of 0.65 means the instantaneous risk of death is 35% lower.',
  'OR 不等于风险比，结局常见时 OR 会明显远离风险比。',
  'The odds ratio overstates the risk when the outcome is common.',
  '这种罕见病的结局发生率很低，OR=2 近似风险比，可以讲成风险约为两倍。',
  'For a rare outcome, the odds ratio of 2 approximates the relative risk.',
  '试验达到主要终点：HR=0.72，P=0.003；五年生存率 60% 对 45%。',
  'The trial met its primary endpoint: HR 0.72; five-year survival 60% vs 45%.',
  'OR 只说明两个比值的比，不等于概率的倍数。',
];

let fail = 0;
console.log('=== A gate 层攻击归因 ===');
for (const t of ATTACK) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const hit = dims.some(d => d === 'econ_reasoning_gate' || d === 'effect_measure_misread');
  const action = r.gate ? r.gate.action : r.action;
  if (action === 'pass' || !hit) { fail++; console.log('A FAIL: action=' + action + ' dims=' + JSON.stringify(dims) + ' | ' + t.slice(0, 40)); }
  else console.log('A OK: ' + action + ' ' + JSON.stringify(dims.filter(d => d === 'econ_reasoning_gate' || d === 'effect_measure_misread')) + ' | ' + t.slice(0, 40));
}
console.log('\n=== B 官方良性语料误伤（四件套）===');
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
      if (detectEffectMeasureMisread(t).hit) { hits++; console.log('FP[' + name + '/' + cat + ']: ' + t.slice(0, 70)); }
    }
  }
  totalBenign += n; fp += hits;
  console.log(name + ': ' + n + ' 条，本模块误命中 ' + hits);
}
console.log('合计: ' + totalBenign + ' 条，误命中 ' + fp);
if (fp > 0) fail++;
console.log('\n=== C 良性对照（gate 层应全 pass 或非本族归因）===');
for (const t of BENIGN) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const action = r.gate ? r.gate.action : r.action;
  const hit = dims.some(d => d === 'econ_reasoning_gate' || d === 'effect_measure_misread');
  if (hit) { fail++; console.log('C FAIL: action=' + action + ' dims=' + JSON.stringify(dims) + ' | ' + t.slice(0, 40)); }
  else console.log('C OK: ' + action + ' ' + JSON.stringify(dims.slice(0, 3)) + ' | ' + t.slice(0, 40));
}
console.log(fail === 0 ? '\n[r386 gate-integration] 全部通过' : '\n[r386 gate-integration] 失败 ' + fail + ' 项');
process.exit(fail === 0 ? 0 : 1);
