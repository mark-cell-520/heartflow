'use strict';
/**
 * test/round-386-effect-measure-misread.test.js — r386 效应量口径误读轮测
 *（r385 结构同款）
 *
 * 判据（效应量口径锚 × 错误口径结论 两腿近距共现 + 两腿间推断标记 + 两组豁免
 *   + 腿②守卫，缺一不判）：
 *   腿① MEASURE 口径锚在场（OR/odds ratio/比值比/优势比/几率比、HR/hazard
 *         ratio/风险比/危害比——RR/相对风险不是锚，「RR=2 风险翻倍」是正确口径）；
 *   腿② WRONGSCALE 错误口径结论在场（a) OR→风险/概率倍数：风险是普通人的 N 倍/
 *         概率是对照组的 N 倍/风险只上升五成；EN N times the risk / is N times
 *         higher；b) HR→累积生存/绝对差：五年生存率从 40% 提高到 70%/活过五年
 *         的概率翻倍/生存率提高 N 个百分点；EN survival improved by N percentage
 *         points / probability of surviving is doubled）；
 *   两腿近距共现（以腿②为锚，ZH 45 字 / EN 150 字符），且两腿之间须见推断标记
 *         （所以/说明/意味着/等于/就代表；EN so/means）——「试验达到终点：
 *         HR=0.72；五年生存率 60% 对 45%」式并列实测发现无推断连接天然不判；
 *   豁免 A 概念讨论（OR 不等于风险比 / odds ratio overstates / HR 不是累积生存）；
 *   豁免 B 正确口径句（罕见结局 OR 近似 RR / OR 反映瞬时相对风险）；
 *   腿②守卫：紧前否定窗（ZH 6 字 / EN 20 字符）+ 前后窗对冲短语。
 *
 * 攻击形（10 条，中英混合，OR/RR 与 HR/累积两子族全覆盖；同池
 *   probe-candidates.js 首段 8 个统计/因果候选族 1/32 穿透被 perfect_error /
 *   conditional_transposition / immortal_time_bias 等存量维度全面代拦，
 *   probe-candidates2.js 二段换轴后本族 5/10 真零命中 gate=pass）。
 * 良性形（18 条：正确相对风险陈述/概念教学/罕见结局近似/并列实测发现/限定性前缀）。
 *
 * gate 路径注意：text-normalizer normalize() 第 6 步对英文大小写归一
 *   （lowercase，v6.7.73），口径锚必须 i flag + (?<![A-Za-z]) 左边界——
 *   首版裸大写 OR/HR 锚在 gate 路径 3/10 静默穿透，本版本修复（r386 实测）。
 *
 * src/index.js 零改动、维度 265 不变、dimMap 键数不变（子族扩族）、VERSION
 *   不 bump（基线 6.8.192 由远端 r380 duration_neglect 设置）。
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const mainGate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = mainGate.gate || mainGate.check;
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const { detectEffectMeasureMisread, __internals } = require(path.join(ROOT, 'src', 'effect-measure-misread.js'));

let passed = 0, failed = 0;
function T(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; console.log('  ✗ ' + name + '\n    ' + (e && e.message)); }
}

// ─── A 模块级攻击命中 ───
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
console.log('=== A 模块级攻击命中 ===');
for (let i = 0; i < ATTACK.length; i++) {
  T(`A${i + 1} 攻击命中（hit + score≥0.6）`, () => {
    const r = detectEffectMeasureMisread(ATTACK[i]);
    assert.ok(r.hit, '未命中: ' + JSON.stringify(r));
    assert.ok(r.score >= 0.6, `score ${r.score} 未过 0.6`);
  });
}

// ─── B 模块级良性零误伤 ───
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
  // 豁免承重证明句（双腿+推断标记俱在，仅靠豁免不判）
  '教材指出 OR 不等于风险比；OR=3.2 所以风险是 3.2 倍',
  'The odds ratio is not the same as the risk ratio; an OR of 4 means the risk is 4 times higher.',
  '罕见结局中 OR 近似风险比，所以 OR=2 意味着风险是 2 倍',
  'For a rare outcome, the odds ratio of 2 approximates the relative risk, so the risk is 2 times higher.',
];
console.log('=== B 模块级良性零误伤 ===');
T('B1 18 条良性零命中', () => {
  const hits = [];
  for (const b of BENIGN) {
    const r = detectEffectMeasureMisread(b);
    if (r.hit) hits.push(b.slice(0, 24) + '…');
  }
  assert.strictEqual(hits.length, 0, '误伤:\n' + hits.join('\n'));
});

// ─── C 负例注入-删条（承重证明）───
const INJECT_KEY = __internals();
const LEG1 = Object.keys(INJECT_KEY).filter(k => /^MEASURE_(ZH|EN)_(OR|HR)$/.test(k));
const LEG2 = Object.keys(INJECT_KEY).filter(k => /^VERDICT_(ZH|EN)_(ORRISK|HRCUM)$/.test(k));
const EXEMPT_KEYS = ['CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN'];
const PROBE_ATTACK = ATTACK[0];
console.log('=== C 负例注入-删条（承重）===');
function nullify(keys) { const o = {}; for (const k of keys) o[k] = /(?!)/i; return o; }
T('C1 全键注入 → 家族从命中消失', () => {
  const before = detectEffectMeasureMisread(PROBE_ATTACK);
  assert.ok(before.hit, '注入前应命中（前提）');
  const after = detectEffectMeasureMisread(PROBE_ATTACK, nullify(Object.keys(INJECT_KEY).filter(k => k !== 'findSignatures' && k !== 'WINDOW_ZH' && k !== 'WINDOW_EN')));
  assert.ok(!after.hit, '全键注入后仍命中——leg 不承重');
});
T('C2 腿① MEASURE 全注入 → 家族消失（腿①承重）', () => {
  const after = detectEffectMeasureMisread(PROBE_ATTACK, nullify(LEG1));
  assert.ok(!after.hit, '腿①注入后仍命中');
});
T('C3 腿② WRONGSCALE 全注入 → 家族消失（腿②承重）', () => {
  const after = detectEffectMeasureMisread(PROBE_ATTACK, nullify(LEG2));
  assert.ok(!after.hit, '腿②注入后仍命中');
});
T('C4 推断标记全注入 → 家族消失（推断连接承重）', () => {
  const after = detectEffectMeasureMisread(PROBE_ATTACK, nullify(['INFER_ZH', 'INFER_EN']));
  assert.ok(!after.hit, '推断标记注入后仍命中');
});
T('C5 豁免注入（永假正则）→ 豁免证明句转命中（豁免承重）', () => {
  const proofs = [
    ['CONCEPT_ZH', '教材指出 OR 不等于风险比；OR=3.2 所以风险是 3.2 倍'],
    ['CONCEPT_EN', 'The odds ratio is not the same as the risk ratio; an OR of 4 means the risk is 4 times higher.'],
    ['CORRECT_ZH', '罕见结局中 OR 近似风险比，所以 OR=2 意味着风险是 2 倍'],
    ['CORRECT_EN', 'For a rare outcome, the odds ratio of 2 approximates the relative risk, so the risk is 2 times higher.'],
  ];
  for (const [k, s] of proofs) {
    assert.ok(!detectEffectMeasureMisread(s).hit, k + ' 默认应豁免');
    assert.ok(detectEffectMeasureMisread(s, nullify([k])).hit, k + ' 注入后应转命中');
  }
});
T('C6 分锚注入：删 OR 锚仅 OR 子族死、删 HR 锚仅 HR 子族死', () => {
  const orAttacks = [ATTACK[0], ATTACK[1], ATTACK[2], ATTACK[6], ATTACK[7]];
  const hrAttacks = [ATTACK[3], ATTACK[4], ATTACK[5], ATTACK[8], ATTACK[9]];
  for (const t of orAttacks) assert.ok(!detectEffectMeasureMisread(t, nullify(['MEASURE_ZH_OR', 'MEASURE_EN_OR'])).hit, '删 OR 锚后 OR 子族仍命中: ' + t.slice(0, 20));
  for (const t of orAttacks) assert.ok(detectEffectMeasureMisread(t, nullify(['MEASURE_ZH_HR', 'MEASURE_EN_HR'])).hit, '删 HR 锚误伤 OR 子族: ' + t.slice(0, 20));
  for (const t of hrAttacks) assert.ok(!detectEffectMeasureMisread(t, nullify(['MEASURE_ZH_HR', 'MEASURE_EN_HR'])).hit, '删 HR 锚后 HR 子族仍命中: ' + t.slice(0, 20));
  for (const t of hrAttacks) assert.ok(detectEffectMeasureMisread(t, nullify(['MEASURE_ZH_OR', 'MEASURE_EN_OR'])).hit, '删 OR 锚误伤 HR 子族: ' + t.slice(0, 20));
});

// ─── D 引擎 gate 兑现 ───
console.log('=== D 引擎 gate 兑现 ===');
for (let i = 0; i < ATTACK.length; i++) {
  T(`D${i + 1} gate.action 非 pass 且归因 econ_reasoning_gate`, () => {
    const r = gcheck(ATTACK[i]);
    const action = r.gate ? r.gate.action : r.action;
    assert.notStrictEqual(action, 'pass', `action=${action}`);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('econ_reasoning_gate'), 'findings: [' + dims.join(',') + ']');
  });
}

// ─── E 插件层接线 ───
console.log('=== E 插件层接线 ===');
T('E1 插件族表含 effect_measure_misread 且计数 44', () => {
  assert.ok(plugin.FAMILIES.some(f => f.key === 'effect_measure_misread' && f.round === 'r386'), '插件族表缺 effect_measure_misread');
  assert.strictEqual(plugin.FAMILIES.length, 44);
});
T('E2 econ 组 36 族 + stats 组 8 族，key 唯一', () => {
  const econ = plugin.FAMILIES.filter(f => f.group === 'econ');
  const stats = plugin.FAMILIES.filter(f => f.group === 'stats');
  assert.strictEqual(econ.length, 36);
  assert.strictEqual(stats.length, 8);
  const keys = plugin.FAMILIES.map(f => f.key);
  assert.strictEqual(new Set(keys).size, 44);
});
T('E3 插件 version 已 bump 至 1.19.0', () => {
  assert.strictEqual(plugin.version, '1.20.0');
});
T('E4 gate 桥族表含 effect_measure_misread 且计数 39', () => {
  const gFams = gate.FAMILIES;
  assert.ok(gFams.some(f => f.key === 'effect_measure_misread' && f.round === 'r386'), 'gate 桥族表缺 effect_measure_misread');
  assert.strictEqual(gFams.length, 39, 'gate 桥族表应为 39 族');
});
T('E5 插件 analyze 归因 effect_measure_misread', () => {
  const r = plugin.analyze(ATTACK[0]);
  assert.ok(r.families.some(x => x.key === 'effect_measure_misread'), '命中族: [' + r.families.map(x => x.key).join(',') + ']');
  assert.ok(r.score > 0.5, `score ${r.score}`);
});

// ─── F 射程邻接核查 ───
console.log('=== F 射程邻接核查 ===');
T('F1 邻族攻击不误命中 effect_measure_misread', () => {
  const neighbors = [
    '研究中相对风险下降了三成，所以你个人的绝对风险一定也下降三成。',   // relative_risk_individual_transfer
    'p 值小于 0.05，所以这个效应在现实中也一定很重要。',                // significance_effect_size
    '确诊人数比去年翻了一倍，所以发病率也翻了一倍。',                    // count_rate_conflation
    '有效率从 10% 提升到 20%，提升幅度高达 200%，效果惊人。',            // percentage_overflow
  ];
  for (const n of neighbors) {
    const r = detectEffectMeasureMisread(n);
    assert.ok(!r.hit, '邻族攻击被误命中: ' + n.slice(0, 20));
  }
});
T('F2 本族攻击族键纯净（不串邻族）', () => {
  const r = plugin.analyze(ATTACK[0]);
  const keys = r.families.map(x => x.key);
  for (const bad of ['relative_risk_individual_transfer', 'significance_effect_size', 'count_rate_conflation', 'percentage_overflow']) {
    assert.ok(!keys.includes(bad), '串到邻族 ' + bad + ': ' + keys.join(','));
  }
});

// ─── G VERSION 未被 r386 改动 ───
console.log('=== G VERSION 未被 r386 改动 ===');
T('G1 VERSION 仍为基线 6.8.192（子族扩族、dimMap 键数不变，不 bump）', () => {
  const v = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.strictEqual(v, '6.8.192', 'VERSION 应为 6.8.192，实为 ' + v);
});

console.log(`\n[r386] round-386-effect-measure-misread: A ${ATTACK.length}/${ATTACK.length} 命中, B ${BENIGN.length}/${BENIGN.length} 零命中, C 6 组注入全翻转, D ${ATTACK.length}/${ATTACK.length} 非 pass, E 插件 44 族接线 + gate 39, F 邻接纯净, G VERSION 6.8.192 未动`);
if (failed > 0) { console.log(`\n# fail ${failed}`); process.exit(1); }
