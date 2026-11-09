/**
 * test/immortal-time-bias.test.js — 第 240 维度 immortal_time_bias 单测
 * （r270）
 *
 * 覆盖：攻击命中（中英双语、裸名词/带修饰/倒装/长句变体，含三条起点错位
 * 路径各自的变体）、良性零误伤（含边缘良性：方法学纠正在场、统一起点明示、
 * 随机对照设计在场、中性时间陈述、流程起点描述）、负例注入（逐常量替换为
 * 空数组后腿失效 + 豁免常量承重）、边界（短文本/空输入/只有锚无疗效结论/
 * 只有疗效结论无锚）、gate 端到端。
 *
 * 缺口实证来源：scripts/round-270/r270-direction-probe.js（多候选族零命中
 * 探针中本族 4/5 穿引擎，survivor_time_bias(226) 对本族四类措辞全部失效）
 * → decision 本体裁决 accelerate（confidence 0.7 / priority 40）→ 本轮实现。
 *
 * 与 survivor_time_bias(226) 的射程区分：后者判「两组病程长度结构不同 →
 * 生存期长短不可比」（起点一致、长度不同）；本维度判「两组计算起点或起点
 * 定义不一致 → 其中一组结构性活过一段不可能死亡的时间」（长度可同、起点
 * 不同）。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const {
  checkImmortalTimeBias,
  __internals,
} = require(path.join(__dirname, '..', 'src', 'immortal-time-bias.js'));

let passed = 0, failed = 0;
function ok(name, cond, extra) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL: ' + name + (extra ? ' | ' + extra : '')); }
}

// ── 一、攻击变体命中（同族 ≥5，中英双语、裸名词、带修饰、倒装、长句）────
// 三条起点错位路径各覆盖：路径 (a) 显式起点差异 / 路径 (b) 两组起点对置 /
// 路径 (c) 存活门槛起点后移；外加起点后移型错位（治疗后立刻）。
const ATTACKS = [
  // 教科书原型（r270 方向探针原句）
  ['proto_zh', '治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。'],
  ['proto_en', 'Patients who survived the first year after treatment lived much longer, so the treatment works.'],
  // 路径 (a) 显式起点差异表述（含时点锚词，缺锚腿不判）
  ['gap_zh', '两组的统计起点不一致，起算点比另一组晚了整整六个月，所以疗效结论需要重新核对。'],
  ['gap_en', 'The two arms had different starting points, and the treatment group had a much higher survival rate, so it works.'],
  // 路径 (b) 两组起点对置（倒装 + 带修饰）
  ['contrast_zh', '治疗组病人从开始治疗起计算生存期，比从确诊起计算的对照组长得多，证明治疗有效。'],
  ['contrast_inv_zh', '从手术成功那天起算，生存期比从确诊起算长得多，可见手术有效。'],
  ['contrast_en', 'The treated group was counted from the first dose while the control group was counted from diagnosis, and the treatment extended life.'],
  // 路径 (c) 存活门槛起点后移（裸名词 + 长句）
  ['window_zh', '只有先活过三十天的患者才被纳入用药组统计，这组五年生存率显著更高，说明药物有效。'],
  ['window_long_zh', '研究把凡是打疫苗超过六个月的人单独归为一组来统计重症率，结果这一组重症率极低，于是作者得出结论说疫苗的保护期至少有六个月。'],
  ['window_en', 'Those who survived the first year after treatment had much better survival, which proves the treatment is effective.'],
];
for (const [k, t] of ATTACKS) {
  const r = checkImmortalTimeBias(t);
  ok('attack[' + k + ']', r.hit === true && r.score > 0, 'hit=' + r.hit + ' score=' + r.score + ' detail=' + r.detail);
}

// ── 二、良性零误伤（含边缘良性）────────────────────────────────────
const BENIGN = [
  // 边缘良性：方法学纠正在场（本族要教的判别动作）
  ['benign_method_zh', '这两组的生存时间起点不一致，存在永生时间偏倚，需要用时依协变量分析重新比较。'],
  ['benign_method_en', 'The comparison suffers from immortal time bias; use a time-dependent covariate analysis.'],
  // 边缘良性：统一起点明示（设计已消除错位）
  ['benign_aligned_zh', '两组均从确诊之日起统一随访，起点一致，所以生存期差异可以反映疗效。'],
  ['benign_aligned_en', 'Both cohorts were counted from the same starting point, so the survival difference is meaningful.'],
  // 边缘良性：随机对照设计在场
  ['benign_rct_zh', '这是一项随机对照试验，两组从同一时间点起算，治疗组生存期更长，说明药物有效。'],
  // 边缘良性：中性时间陈述（锚在场但无错位路径、无疗效结论）
  ['benign_neutral_zh', '本研究的随访起点设定为患者首次入院当日。'],
  ['benign_fact_zh', '这种疾病的平均生存期大约是两年。'],
  // 边缘良性：起点差异纯流程描述（排期/账期，无生存期或疗效语义）
  ['benign_flow_zh', '两个项目的排期起点不同，工期计算口径也不一样，需要重新对齐甘特图。'],
];
for (const [k, t] of BENIGN) {
  const r = checkImmortalTimeBias(t);
  ok('benign[' + k + ']', r.hit === false && r.score === 0, 'hit=' + r.hit + ' score=' + r.score + ' detail=' + r.detail);
}

// ── 三、负例注入：逐常量替换为空数组后腿失效 ────────────────────────
// 口径同 r250：中文探针句只验证中文承重常量；英文探针句只验证英文承重
// 常量。豁免类常量用「会触发该豁免的攻击句」验证：置空前不命中、置空后
// 命中，证明豁免本身在承重。
//
// [r270 实测修正] 首版用单一句做全部注入，但 PROBE_ZH 实际走 START_GAP_ZH
// （起点后移型）路径，置空 CONTRAST/WINDOW 当然不影响——三条错位路径各自
// 独立承重，注入必须**按路径分配专属探针句**：
//   路径 (a) 显式起点差异 → PROBE_GAP
//   路径 (b) 两组起点对置 → PROBE_CONTRAST
//   路径 (c) 存活门槛后移 → PROBE_WINDOW
const PROBE_GAP_ZH = '这两组的统计起点不一致，起算点比另一组晚了整整六个月，所以疗效结论需要重新核对。';
const PROBE_CONTRAST_ZH = '治疗组病人从开始治疗起计算生存期，比从确诊起计算的对照组长得多，证明治疗有效。';
const PROBE_WINDOW_ZH = '只有先活过三十天的患者才被纳入用药组统计，这组五年生存率显著更高，说明药物有效。';
const PROBE_GAP_EN = 'The two arms had different starting points, and the treatment group had a much higher survival rate, so it works.';
const PROBE_CONTRAST_EN = 'The treated group was counted from the first dose while the control group was counted from diagnosis, and the treatment extended life.';
const PROBE_WINDOW_EN = 'Only patients who survived the first month were counted in the treated arm, which had a much higher survival rate, proving the drug works.';
for (const [k, t] of [['gap_zh', PROBE_GAP_ZH], ['contrast_zh', PROBE_CONTRAST_ZH], ['window_zh', PROBE_WINDOW_ZH]]) {
  ok('inject/baseline-' + k, checkImmortalTimeBias(t).hit === true, 'baseline 应命中');
}
for (const [k, t] of [['gap_en', PROBE_GAP_EN], ['contrast_en', PROBE_CONTRAST_EN], ['window_en', PROBE_WINDOW_EN]]) {
  ok('inject/baseline-' + k, checkImmortalTimeBias(t).hit === true, 'baseline 应命中');
}
// 锚腿 + 疗效腿承重：三条路径的中文句都应因锚/疗效失效而整体失效
for (const probe of [PROBE_GAP_ZH, PROBE_CONTRAST_ZH, PROBE_WINDOW_ZH]) {
  for (const key of ['START_ANCHOR_ZH', 'EFFICACY_ZH']) {
    const inject = {};
    inject[key] = [];
    const r = checkImmortalTimeBias(probe, inject);
    ok('inject[zh-leg ' + key + '=[] ' + probe.slice(0, 6) + ']', r.hit === false,
      '置空 ' + key + ' 后应失效，实际 hit=' + r.hit);
  }
}
// 各路径腿独立承重：只置空本路径腿 → 该路径句失效
const PATH_LEGS = [
  [PROBE_GAP_ZH, 'START_GAP_ZH'], [PROBE_CONTRAST_ZH, 'START_CONTRAST_ZH'], [PROBE_WINDOW_ZH, 'IMMORTAL_WINDOW_ZH'],
  [PROBE_GAP_EN, 'START_GAP_EN'], [PROBE_CONTRAST_EN, 'START_CONTRAST_EN'], [PROBE_WINDOW_EN, 'IMMORTAL_WINDOW_EN'],
];
for (const [probe, key] of PATH_LEGS) {
  const inject = {};
  inject[key] = [];
  const r = checkImmortalTimeBias(probe, inject);
  ok('inject[path-leg ' + key + '=[]]', r.hit === false,
    '置空 ' + key + ' 后该路径句应失效，实际 hit=' + r.hit);
}
// 英文腿承重（置空 → 英文句失效）
for (const probe of [PROBE_GAP_EN, PROBE_CONTRAST_EN, PROBE_WINDOW_EN]) {
  for (const key of ['START_ANCHOR_EN', 'EFFICACY_EN']) {
    const inject = {};
    inject[key] = [];
    const r = checkImmortalTimeBias(probe, inject);
    ok('inject[en-leg ' + key + '=[] ' + probe.slice(0, 8) + ']', r.hit === false,
      '置空 ' + key + ' 后应失效，实际 hit=' + r.hit);
  }
}
// 豁免承重：对「会触发豁免的攻击句」置空对应豁免常量 → 由不命中变命中
const EXEMPT_PROBES = [
  ['EXEMPT_METHOD_ZH', '治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后——这是永生时间偏倚，需用时依协变量分析。'],
  ['EXEMPT_ALIGNED_ZH', '两组均从确诊之日起统一随访，治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案有效。'],
  ['EXEMPT_DESIGN_ZH', '这是一项随机对照试验，治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案有效。'],
  ['EXEMPT_METHOD_EN', 'Patients who survived the first year after treatment lived much longer, which looks like the treatment works, but it is classic immortal time bias.'],
  ['EXEMPT_ALIGNED_EN', 'Both cohorts were counted from the same starting point, and patients who survived the first year after treatment lived much longer, so the treatment works.'],
];
for (const [key, text] of EXEMPT_PROBES) {
  const before = checkImmortalTimeBias(text);
  const inject = {};
  inject[key] = [];
  const after = checkImmortalTimeBias(text, inject);
  ok('inject[exempt ' + key + ']',
    before.hit === false && after.hit === true,
    '置空前应被豁免(hit=' + before.hit + ')，置空后应命中(hit=' + after.hit + ')');
}

// ── 四、边界：短文本、空输入、单腿缺位 ─────────────────────────────
ok('edge/empty', checkImmortalTimeBias('').hit === false);
ok('edge/short', checkImmortalTimeBias('起算').hit === false);
ok('edge/null', checkImmortalTimeBias(null).hit === false);
ok('edge/undefined', checkImmortalTimeBias(undefined).hit === false);
ok('edge/number', checkImmortalTimeBias(12345).hit === false);
// 只有锚无疗效结论 → 不判
ok('edge/no-effic', checkImmortalTimeBias('从手术成功那天起算，这组的生存期数据已记录在附录三。').hit === false);
// 只有疗效结论无锚 → 不判
ok('edge/no-anchor', checkImmortalTimeBias('这个药有效，价格也不贵，患者反馈不错。').hit === false);

// ── 五、gate 端到端（维度已接线）───────────────────────────────────
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
for (const [k, t] of ATTACKS) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  ok('gate[' + k + ']',
    r.gate.action !== 'pass' && dims.indexOf('immortal_time_bias') >= 0,
    'action=' + r.gate.action + ' dims=' + dims.join(','));
}

console.log('\nimmortal-time-bias 测试: ' + passed + ' passed / ' + failed + ' failed');
if (failed > 0) process.exit(1);
