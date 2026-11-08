/**
 * test/survivor-time-bias.test.js — 第 226 维度 survivor_time_bias 单测
 *
 * 覆盖：攻击命中（中英双语、含裸名词/带修饰/倒装/长句变体）、良性零误伤
 * （含边缘良性：正确多因陈述、元陈述破除、随机对照设计在场、比率口径）、
 * 负例注入（逐常量替换为空数组后腿失效）、边界（短文本/纯生存期事实陈述
 * 无疗效结论）、gate 端到端。
 *
 * 缺口实证来源：scripts/round-249/probe-gap-r249.js（r250 复跑确认本族
 * 中英双语 2/2 全漏判）→ decision 本体裁决 accelerate → 本轮实现。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const {
  checkSurvivorTimeBias,
  __internals,
} = require(path.join(__dirname, '..', 'src', 'survivor-time-bias.js'));

let passed = 0, failed = 0;
function ok(name, cond, extra) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL: ' + name + (extra ? ' | ' + extra : '')); }
}

// ── 一、攻击变体命中（同族 ≥5，中英双语、裸名词、带修饰、倒装、长句）────
const ATTACKS = [
  // 教科书原型（r249 探针原句）
  ['proto_zh', '接受这种疗法的病人平均活了五年，没接受的只活了一年，可见这疗法有效'],
  ['proto_en', 'Patients who took the drug lived 5 years on average while others lived 1, so the drug works'],
  // 裸名词形态（不带数字的「生存期」）
  ['bare_zh', '治疗组生存期明显长于对照组，说明这个方案能延长生命'],
  ['bare_en', 'The treatment group had a longer survival period, proving the drug extends life'],
  // 带修饰（整整/上下）
  ['mod_zh', '服用该药的患者平均多活了三年，可见这药确实有效'],
  ['mod_en', 'Patients on the therapy survived 3 years longer than the control group, so it works'],
  // 倒装
  ['inv_zh', '疗效是确凿的——吃了这个药的病人比没吃的多活了整整四年'],
  ['inv_en', 'It clearly works: those who took the medicine lived four years longer'],
  // 长句
  ['long_zh', '在这项回顾中，凡是坚持用完疗程的人都活了六年上下，而中途停药或从未用药的只撑了两年左右，可见坚持用药能够延命'],
  ['long_en', 'In this review, patients who completed the regimen survived about six years, whereas those who stopped or never started lasted only about two, which shows completing the regimen extends life'],
  // 救命型疗效结论
  ['save_zh', '用了新方案的人平均活了八年，没用的只活了三年，这方案救了命'],
  ['save_en', 'The ones on the new protocol survived eight years on average, the others only three, so the protocol saves lives'],
  // 中位生存期
  ['median_zh', '该组中位生存期达到四年，未治疗组仅一年，表明干预有效'],
  ['median_en', 'Median survival reached four years in the treated arm versus one year untreated, demonstrating the intervention is effective'],
  // 另一对照组措辞
  ['other_zh', '接种者平均活了十年，安慰剂组只活了五年，可见疫苗有用'],
  ['other_en', 'Vaccinated patients lived ten years on average while the placebo group lived five, so the vaccine works'],
];
for (const [k, t] of ATTACKS) {
  const r = checkSurvivorTimeBias(t);
  ok('attack[' + k + ']', r.hit === true && r.score > 0, 'hit=' + r.hit + ' score=' + r.score);
}

// ── 二、良性零误伤（含边缘良性）────────────────────────────────────
const BENIGN = [
  // 边缘良性：正确多因陈述（161 轮教训同款）
  ['benign_multi', '生存期长短受病程、分期、合并症等多因共同影响，不能只归因于用药'],
  // 边缘良性：指出长度偏倚的元陈述（本族要教的判别动作）
  ['benign_meta_zh', '两组的病程长度不同，生存期差异可能是长度偏倚造成的，不能直接推出疗效'],
  ['benign_meta_en', 'The survival gap may reflect length-time bias rather than a real treatment effect'],
  // 边缘良性：随机对照设计在场
  ['benign_rct_zh', '在这项随机对照试验中，治疗组五年生存率显著更高，支持药物有效'],
  ['benign_rct_en', 'In this randomized controlled trial, the treated arm had a significantly higher five-year survival rate'],
  // 边缘良性：统计学教学反例
  ['benign_teach_zh', '用生存期长短证明疗效是幸存时间偏误的典型错误，应改做同期队列比较'],
  ['benign_teach_en', 'Comparing survival durations alone is a length-time bias; use matched cohorts instead'],
  // 边缘良性：纯生存期事实陈述无疗效结论
  ['benign_fact_zh', '该组病人平均活了五年，数据已记录在附录三'],
  ['benign_fact_en', 'Patients in that arm lived five years on average, as recorded in appendix three'],
  // 边缘良性：明确说生存期不可比
  ['benign_nc_zh', '两组的生存期不可比，因为入院时的病程结构差异太大'],
  ['benign_nc_en', 'The survival times are not comparable because the baseline disease duration differs'],
  // 中性时间陈述
  ['benign_neutral_zh', '对照组平均存活一年，这是试验记录的一部分'],
  ['benign_neutral_en', 'The control group survived one year on average, per the trial record'],
];
for (const [k, t] of BENIGN) {
  const r = checkSurvivorTimeBias(t);
  ok('benign[' + k + ']', r.hit === false && r.score === 0, 'hit=' + r.hit + ' score=' + r.score + ' ' + r.detail);
}

// ── 三、负例注入：逐常量替换为空数组后腿失效 ────────────────────────
// 注入口径：中文探针句只验证中文承重常量（三条腿的中文侧置空后必须失效——
// 证明中文腿独立承重）；英文探针句只验证英文承重常量。豁免类常量用
// 「会触发该豁免的攻击句」验证：置空前不命中、置空后命中，证明豁免本身
// 在承重。若对中文句注入 EN 常量仍命中，那是双语腿设计的预期（中文腿
// 独立承重），不是缺陷。
const PROBE_ZH = '接受这种疗法的病人平均活了五年，没接受的只活了一年，可见这疗法有效';
const PROBE_EN = 'Patients who took the drug lived 5 years on average while others lived 1, so the drug works';
ok('inject/baseline-zh', checkSurvivorTimeBias(PROBE_ZH).hit === true, 'baseline 应命中');
ok('inject/baseline-en', checkSurvivorTimeBias(PROBE_EN).hit === true, 'baseline 应命中');
// 中文腿承重（置空 → 中文句失效）
for (const key of ['SURVIVAL_ZH', 'EFFICACY_ZH', 'CONTRAST_ZH']) {
  const inject = {};
  inject[key] = [];
  const r = checkSurvivorTimeBias(PROBE_ZH, inject);
  ok('inject[zh-leg ' + key + '=[]]', r.hit === false, '置空 ' + key + ' 后中文句应失效，实际 hit=' + r.hit);
}
// 英文腿承重（置空 → 英文句失效）
for (const key of ['SURVIVAL_EN', 'EFFICACY_EN', 'CONTRAST_EN']) {
  const inject = {};
  inject[key] = [];
  const r = checkSurvivorTimeBias(PROBE_EN, inject);
  ok('inject[en-leg ' + key + '=[]]', r.hit === false, '置空 ' + key + ' 后英文句应失效，实际 hit=' + r.hit);
}
// 豁免承重：对「会触发豁免的攻击句」置空对应豁免常量 → 由不命中变命中
const EXEMPT_PROBES = [
  ['EXEMPT_DESIGN_ZH', '在这项随机对照试验中，治疗组病人平均活了五年，没接受的只活了一年，可见这疗法有效'],
  ['EXEMPT_DESIGN_EN', 'In this randomized controlled trial, patients on the drug lived 5 years while the control lived 1, so the drug works'],
  ['EXEMPT_META_ZH', '两组病程长度不同，治疗组平均活了五年，没接受的只活了一年，可见这疗法有效——但这是长度偏倚造成的'],
  ['EXEMPT_META_EN', 'Treated patients lived 5 years while controls lived 1, which seems to prove the drug works, but the gap reflects length-time bias'],
  ['EXEMPT_RATE_ZH', '治疗组五年生存率更高，平均活了五年，没接受的只活了一年，可见这疗法有效'],
  ['EXEMPT_RATE_EN', 'The treatment group had a higher survival rate: they lived 5 years while controls lived 1, so the drug works'],
];
for (const [key, text] of EXEMPT_PROBES) {
  const before = checkSurvivorTimeBias(text);
  const inject = {};
  inject[key] = [];
  const after = checkSurvivorTimeBias(text, inject);
  ok('inject[exempt ' + key + ']',
    before.hit === false && after.hit === true,
    '置空前应被豁免(hit=' + before.hit + ')，置空后应命中(hit=' + after.hit + ')');
}

// ── 四、边界：短文本与空输入 ────────────────────────────────────────
ok('edge/empty', checkSurvivorTimeBias('').hit === false);
ok('edge/short', checkSurvivorTimeBias('活了').hit === false);
ok('edge/null', checkSurvivorTimeBias(null).hit === false);
ok('edge/undefined', checkSurvivorTimeBias(undefined).hit === false);
// 只有生存期无疗效结论 → 不判
ok('edge/no-effic', checkSurvivorTimeBias('该组病人平均活了五年，数据记录在附录').hit === false);
// 只有疗效结论无生存期语义 → 不判
ok('edge/no-surv', checkSurvivorTimeBias('这个药有效，价格也不贵').hit === false);

// ── 五、gate 端到端（维度已接线）───────────────────────────────────
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
for (const [k, t] of ATTACKS.slice(0, 6)) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  ok('gate[' + k + ']',
    r.gate.action !== 'pass' && dims.indexOf('survivor_time_bias') >= 0,
    'action=' + r.gate.action + ' dims=' + dims.join(','));
}

console.log('\nsurvivor-time-bias 测试: ' + passed + ' passed / ' + failed + ' failed');
if (failed > 0) process.exit(1);
