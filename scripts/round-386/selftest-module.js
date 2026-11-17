/**
 * scripts/round-386/selftest-module.js — r386 effect_measure_misread 模块级自测
 * A 攻击命中（10/10）· B 良性零命中（15+4）· C 注入删条翻转（按锚分组）
 * D 豁免注入翻转（CONCEPT/CORRECT 承重证明）
 */
'use strict';
const { detectEffectMeasureMisread, __internals } = require('../../src/effect-measure-misread.js');

// [anchorMeasure, anchorVerdict, text]
const ATTACK = [
  ['MEASURE_ZH_OR', 'VERDICT_ZH_ORRISK', 'OR=1.5 就代表风险只上升五成，这个因素不值得担心。'],
  ['MEASURE_ZH_OR', 'VERDICT_ZH_ORRISK', 'logistic 回归显示 OR 为 3.2，说明服药者患病的风险是普通人的 3.2 倍。'],
  ['MEASURE_ZH_OR', 'VERDICT_ZH_ORRISK', '病例对照研究的 OR 达到 4，这意味着暴露组的发病概率是对照组的 4 倍。'],
  ['MEASURE_ZH_HR', 'VERDICT_ZH_HRCUM', '风险比降到 0.5，等于患者活过五年的概率翻倍。'],
  ['MEASURE_ZH_HR', 'VERDICT_ZH_HRCUM', '风险比 HR=0.7，说明新药把五年生存率从 50% 提高到了 85%。'],
  ['MEASURE_ZH_HR', 'VERDICT_ZH_HRCUM', '新药的风险比为 0.8，意味着患者的生存率将提高 15 个百分点。'],
  ['MEASURE_EN_OR', 'VERDICT_EN_ORRISK', 'An OR of 4 means the probability of disease is four times higher.'],
  ['MEASURE_EN_OR', 'VERDICT_EN_ORRISK', 'The odds ratio was 3.2, so the exposed group has 3.2 times the risk.'],
  ['MEASURE_EN_HR', 'VERDICT_EN_HRCUM', 'A hazard ratio of 0.7 means five-year survival improved by 30 percentage points.'],
  ['MEASURE_EN_HR', 'VERDICT_EN_HRCUM', 'HR = 0.5 means the probability of surviving five years is doubled.'],
];

const BENIGN = [
  // 正确相对风险陈述（腿②缺失）
  'HR=0.7 说明死亡风险下降三成，这是相对风险的改善。',
  'RR=2 说明暴露组的发病风险是对照组的两倍，这里的风险比口径用对了。',
  'OR 为 2.4，说明病例组的暴露比值是对照组的 2.4 倍。',
  'The hazard ratio of 0.65 means the instantaneous risk of death is 35% lower.',
  'The relative risk of 2.0 means the exposed group has twice the risk.',
  // 概念教学（CONCEPT 豁免）
  'OR 不等于风险比，结局常见时 OR 会明显远离风险比。',
  '风险比不是累积生存概率，它反映的是瞬时相对风险。',
  'The odds ratio overstates the risk when the outcome is common.',
  'A hazard ratio is not the cumulative risk of dying.',
  // 罕见结局近似（CORRECT 豁免）
  '这种罕见病的结局发生率很低，OR=2 近似风险比，可以讲成风险约为两倍。',
  'For a rare outcome, the odds ratio of 2 approximates the relative risk.',
  // 并列实测发现无推断标记
  '试验达到主要终点：HR=0.72，P=0.003；五年生存率 60% 对 45%。',
  'The trial met its primary endpoint: HR 0.72; five-year survival 60% vs 45%.',
  // 限定性前缀（只说明）
  'OR 只说明两个比值的比，不等于概率的倍数。',
];

// 豁免承重证明句：双腿+推断标记俱在，仅靠 CONCEPT/CORRECT 豁免才不判。
const EXEMPT_PROOF = [
  ['CONCEPT_ZH', '教材指出 OR 不等于风险比；OR=3.2 所以风险是 3.2 倍'],
  ['CONCEPT_EN', 'The odds ratio is not the same as the risk ratio; an OR of 4 means the risk is 4 times higher.'],
  ['CORRECT_ZH', '罕见结局中 OR 近似风险比，所以 OR=2 意味着风险是 2 倍'],
  ['CORRECT_EN', 'For a rare outcome, the odds ratio of 2 approximates the relative risk, so the risk is 2 times higher.'],
];

let fail = 0;
// A 攻击命中
for (const [, , t] of ATTACK) {
  const r = detectEffectMeasureMisread(t);
  if (!r.hit) { fail++; console.log('A MISS: ' + t.slice(0, 54)); }
}
console.log('A 攻击命中: ' + (ATTACK.length - fail) + '/' + ATTACK.length);

// B 良性零命中（含豁免证明句的默认形态）
let benignHit = 0;
for (const t of BENIGN) {
  const r = detectEffectMeasureMisread(t);
  if (r.hit) { benignHit++; console.log('B FP: ' + r.details.slice(0, 60) + ' | ' + t.slice(0, 50)); }
}
for (const [, t] of EXEMPT_PROOF) {
  const r = detectEffectMeasureMisread(t);
  if (r.hit) { benignHit++; console.log('B FP(exempt): ' + t.slice(0, 50)); }
}
console.log('B 良性误命中: ' + benignHit + '/' + (BENIGN.length + EXEMPT_PROOF.length));
if (benignHit > 0) fail++;

// C 注入删条：删某锚组/某结论组 → 仅依赖该组的攻击失配
const NEVER = /(?!x)x/;
function injected(k, v) { const o = {}; o[k] = v; return o; }
for (const group of ['MEASURE_ZH_OR', 'MEASURE_ZH_HR', 'MEASURE_EN_OR', 'MEASURE_EN_HR',
  'VERDICT_ZH_ORRISK', 'VERDICT_ZH_HRCUM', 'VERDICT_EN_ORRISK', 'VERDICT_EN_HRCUM']) {
  const inj = injected(group, []);
  const shouldDie = ATTACK.filter(a => a[0] === group || a[1] === group);
  const shouldLive = ATTACK.filter(a => a[0] !== group && a[1] !== group);
  let diedOK = 0;
  for (const [, , t] of shouldDie) if (!detectEffectMeasureMisread(t, inj).hit) diedOK++;
  let liveOK = 0;
  for (const [, , t] of shouldLive) if (detectEffectMeasureMisread(t, inj).hit) liveOK++;
  const ok = diedOK === shouldDie.length && liveOK === shouldLive.length;
  if (!ok) { fail++; console.log('C FAIL: 删 ' + group + ' → 依赖组死亡 ' + diedOK + '/' + shouldDie.length + '，非依赖组存活 ' + liveOK + '/' + shouldLive.length); }
  else console.log('C OK: 删 ' + group + ' → 依赖组 ' + diedOK + '/' + shouldDie.length + ' 全死，非依赖组 ' + liveOK + '/' + shouldLive.length + ' 全活');
}
// 推断标记删条 → 全部攻击失配
{
  const inj = { INFER_ZH: NEVER, INFER_EN: NEVER };
  let survived = 0;
  for (const [, , t] of ATTACK) if (detectEffectMeasureMisread(t, inj).hit) survived++;
  if (survived > 0) { fail++; console.log('C FAIL: 删 INFER 后仍有 ' + survived + ' 条攻击命中'); }
  else console.log('C OK: 删 INFER_ZH/EN → 攻击 0/' + ATTACK.length);
}
// 豁免删条（永假正则）→ 对应豁免证明句转为命中
for (const [g, t] of EXEMPT_PROOF) {
  const r0 = detectEffectMeasureMisread(t);
  const r1 = detectEffectMeasureMisread(t, injected(g, NEVER));
  if (r0.hit || !r1.hit) { fail++; console.log('D FAIL: ' + g + ' 默认命中=' + r0.hit + ' 注入后命中=' + r1.hit + ' | ' + t.slice(0, 40)); }
  else console.log('D OK: ' + g + ' 豁免承重（注入永假后转命中）');
}

console.log(fail === 0 ? '\n[r386 selftest-module] 全部通过' : '\n[r386 selftest-module] 失败 ' + fail + ' 项');
process.exit(fail === 0 ? 0 : 1);
