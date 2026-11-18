/**
 * test/round-392-per-protocol-misread.test.js
 * r392 轮单测：per_protocol_misread 第 42 子族（按方案分析集误读）
 *
 * 轮次背景：选题库续统计素养轴（r386 效应量口径 / r387 显著性裁定 / r388 删失 /
 * r389 替代终点），r390 研究轮预选 per_protocol 为首选，立项前完成与
 * healthy_user_bias（r372）的射程解剖：本族腿①锁定**试验分析集限定操作**
 * （只统计/排除/按方案集/依从者亚组）、腿②锁定**试验疗效兑现**（真实疗效/
 * 确凿/药物确实有效）；r372 腿①锁定自选择健康行为群体、腿②锁定健康结果
 * 归因。交集句可双触发（r379 union 先例），本族独家覆盖「分析集操作 × 疗效
 * 兑现」形——立项探针 scripts/round-392/probe-per-protocol.js（合并树
 * v6.8.193 基线）攻击 11/18 穿透（真零命中）、良性 21/25 基线通过（4 条非
 * pass 全系存量维度误伤非本族增量）、射程对照 1/7（proxy 攻击形不越界）。
 * 海外扫描 arXiv parse-fail / GitHub 0 / S2 429——空返，按既有形态自建。
 *
 * 与 r389 的判据差异（设计决策）：本族**不强制推断标记**——腿②词表自身即
 * 「有效性兑现」结构（确凿/真实/确切/证明有效/clearly worked），分析集限定
 * 与疗效兑现的共现本身就是推断（「只统计完成者 → 疗效确凿」）；r389 需要
 * 推断标记是因为其腿②（硬终点获益）可以是并列实测陈述。故负例注入无 C4
 * 推断标记组，豁免/守卫组顺延为 C4/C5/C6。
 *
 * 三层验证（同 r386/r388/r389 范式）：
 *   1. 模块级 detectPerProtocolMisread 直接调用
 *   2. gate 层 mainGate.gate 归因（econ_reasoning_gate 聚合族承重）
 *   3. 插件层注册（version / family 列表 / analyze 归因）
 *   4. 负例注入-删条（承重证明：双腿/双豁免/双腿守卫）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const mainGate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = mainGate.gate || mainGate.check;
const { detectPerProtocolMisread, __internals } = require(path.join(ROOT, 'src', 'per-protocol-misread.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const gate = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS ' + msg); }
  else { fail++; console.log('  FAIL ' + msg); }
}

// ─── 攻击样本：按方案分析集误读（中英双语）────────────────────
const ATTACKS = [
  // r389 探针原样（10）
  '只分析完成全部疗程的患者，疗效非常显著，说明药物确实有效。',
  '排除不依从的受试者后，治疗组结局明显更好，可见药效可靠。',
  '按完成试验的人群分析，新疗法把风险降低了一半，这就是真实疗效。',
  '退出试验的人不用管，只看坚持下来的，效果依然明确。',
  '只统计按方案用药的人群，新药的效果非常确凿。',
  '依从性好的那部分患者效果显著，这就是药物的真实效果。',
  'Among patients who completed the full course, the drug clearly worked, proving its efficacy.',
  'Excluding non-adherent participants, the treatment halved the risk, which is the real effect.',
  'Looking only at those who finished the program, the outcome improvement is substantial.',
  'In the adherent subgroup the drug worked well, which is its true effect.',
  // r392 立项探针扩样（8）
  '只纳入按时服完药的受试者，这样测出来的疗效才是药物的真实水平。',
  '把中途停药的人都剔掉之后，剩余患者的治愈率非常高，足见药效过硬。',
  '只看完成了整个方案的那一组，新药的疗效确凿无疑。',
  '按方案集分析显示风险下降明显，可见疗效是确切的。',
  '坚持完成随访的患者结局最好，这就是治疗的真实效果。',
  'Counting only those who took the drug as prescribed, the treatment clearly works.',
  'Among completers the therapy performed remarkably well, which demonstrates its true efficacy.',
  'Restricting the analysis to adherent patients, the drug genuinely works.',
  // 模块自测追加措辞变体（腿形覆盖验证）
  '只计算完成了全部治疗的受试者，新药的疗效非常确切。',
  '剔除未完成方案的患者后，剩下的数据显示药效确凿。',
  '不依从的受试者全部排除之后，治疗组效果明确，足以说明药物有效。',
  '按照完成试验的受试者来分析，这种疗法的真实效果无可置疑。',
  '依从性高的那部分患者症状缓解明显，这就是药物的真实疗效。',
  'Only participants who finished the entire program were analyzed, and the drug clearly works.',
  'After removing the non-compliant subjects, the cure rate was very high, proving the drug works.',
  'In the adherent subgroup the treatment performed remarkably well, which is the real effect.',
];

// ─── 良性样本：豁免/守卫/相邻族射程/中性报告 ──────────────────
const BENIGNS = [
  // 正确方法论 / 概念教学（豁免 A/B）
  '意向性治疗分析才是主分析，按方案分析只能作为辅助参考。',
  '按方案分析集破坏了随机化，两组不再可比，不能单独作为疗效证据。',
  '所谓按方案分析，是指只统计完成全程的受试者，它会高估治疗效果。',
  '只统计依从者会高估药效，这是按方案分析的已知缺陷。',
  '按方案分析集的结果与意向性治疗分析一致，都显示风险下降。',
  '脱落患者的后续结局未知，需要在意向性治疗框架下保守估计。',
  'The intention-to-treat analysis is the primary; per-protocol results are supportive only.',
  'Per-protocol analysis means counting only completers, and it can overstate the treatment effect.',
  'The per-protocol set and the ITT set agreed, both showing a risk reduction.',
  'The study reported no per-protocol analysis, only the intention-to-treat result.',
  // 中性报告（腿②缺省）
  '试验中脱落的患者偏多，数据可靠性有限，结论要谨慎。',
  '两组患者的依从性都在80%以上，脱落率很低。',
  '这项研究没有报告按方案分析集，只有意向性治疗分析的结果。',
  '虽然只看了完成治疗的受试者，样本量已经太小，说明不了任何问题。',
  '退出试验的患者特征与完成者不同，这会引入选择偏倚。',
  '完成全程治疗的患者肿瘤标志物下降更明显。',
  '服药依从性高与更好的健康结局相关，但可能只是自选择混杂。',
  '完成了半年随访的受试者共320人，随访完成率91%。',
  '按方案服药的患者比例越高，说明临床试验的质量控制越好。',
  'Many participants dropped out, so the reliability of the data is limited.',
  'Completers and dropouts differed in baseline characteristics, which introduces selection bias.',
  'Adherence was high in both arms, with few discontinuations.',
  'Among those who completed the trial, side effects were similar between groups.',
  'The trial stopped early, so the follow-up data remain incomplete.',
  'Adherence to the protocol was 85% in the treatment arm and 82% in the control arm.',
  // 锚前否定 / 对冲（守卫）
  '不能只看坚持服药的人，还要看全体受试者的结果。',
  '我们并未只统计完成者，全部入组患者都纳入了分析。',
  'We should not look only at those who completed the program; all randomized patients count.',
  // 相邻族射程（不判）
  '重症患者才用上了新药，所以他们的结局差不能全怪药效不好。',
  '吃维生素的人更健康，所以维生素让人健康。',
  '只统计点击了广告的用户，转化率非常高，说明营销有效。',
  'Sicker patients were given the new drug, so their worse outcomes reflect baseline risk.',
  'Supplement users are healthier, which proves vitamins keep you healthy.',
  'Among users who clicked the ad, conversion was very high, so the marketing works.',
];

// ═══ 测试 1：模块级攻击全命中 ═══
console.log('\n[1] 模块级 detectPerProtocolMisread — 攻击样本');
ATTACKS.forEach((t, i) => {
  const r = detectPerProtocolMisread(t);
  ok(r.hit === true, `A${i + 1} hit（score=${r.score}, count=${r.count}）`);
});

// ═══ 测试 2：模块级良性零误伤 ═══
console.log('\n[2] 模块级 detectPerProtocolMisread — 良性样本零误伤');
BENIGNS.forEach((t, i) => {
  const r = detectPerProtocolMisread(t);
  ok(r.hit === false, `B${i + 1} 不命中`);
});

// ═══ 测试 3：命中结构完整性 ═══
console.log('\n[3] 命中结果结构完整性');
{
  const r = detectPerProtocolMisread(ATTACKS[4]);
  ok(r.dimension === 'per_protocol_misread', 'dimension 字段正确');
  ok(typeof r.severity === 'number' && r.severity >= 60 && r.severity <= 100, `severity 在 60-100（${r.severity}）`);
  ok(typeof r.guidance === 'string' && r.guidance.length > 100, 'guidance 非空且充实');
  ok(Array.isArray(r.evidence) && r.evidence.length >= 1, 'evidence 数组非空');
  ok(Array.isArray(r.tags) && r.tags.includes('per-protocol-analysis'), 'tags 含 per-protocol-analysis');
}

// ═══ 测试 4：gate 层归因（econ_reasoning_gate 聚合族承重）═════
console.log('\n[4] gate 层归因');
{
  let econAttr = 0;
  let nonPass = 0;
  const missing = [];
  ATTACKS.forEach((t) => {
    const r = gcheck(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (dims.includes('econ_reasoning_gate')) { econAttr++; } else { missing.push(t); }
    if (r.gate && r.gate.action !== 'pass') { nonPass++; }
  });
  ok(nonPass === ATTACKS.length, `gate 层 action 非 pass ${nonPass}/${ATTACKS.length}`);
  ok(econAttr === ATTACKS.length, `gate 层 econ_reasoning_gate 归因 ${econAttr}/${ATTACKS.length}`);
  for (const m of missing) console.log('    [无 econ 归因] ' + m);
}

// ═══ 测试 5：gate 层良性不被升级为 block ═══
console.log('\n[5] gate 层良性不被 block');
BENIGNS.forEach((t, i) => {
  const r = gcheck(t);
  ok(r.gate.action !== 'block', `B${i + 1} action=${r.gate.action}（非 block）`);
});

// ═══ 测试 6：插件层注册（含 FAMILIES 计数 + analyze 归因）═════
console.log('\n[6] 插件层注册');
{
  ok(plugin.version === '1.23.0', `version=1.23.0（${plugin.version}）`);
  const desc = String(plugin.description || '');
  ok(desc.includes('per_protocol_misread'), 'description 含 per_protocol_misread');
  ok(desc.includes('r392'), 'description 含 r392');
  ok(desc.includes('47 族'), 'description 标注 47 族');
  ok(plugin.FAMILIES.some(f => f.key === 'per_protocol_misread' && f.round === 'r392'), 'FAMILIES 含 per_protocol_misread（round r392）');
  ok(plugin.FAMILIES.length === 47, `FAMILIES 47 族（实际 ${plugin.FAMILIES.length}）`);
  const econN = plugin.FAMILIES.filter(f => f.group === 'econ').length;
  const statsN = plugin.FAMILIES.filter(f => f.group === 'stats').length;
  ok(econN === 36, `econ 组 36 族（实际 ${econN}）`);
  ok(statsN === 11, `stats 组 11 族（实际 ${statsN}）`);
  ok(new Set(plugin.FAMILIES.map(f => f.key)).size === 47, 'FAMILIES key 唯一');
  const gFams = gate.FAMILIES;
  ok(gFams.some(f => f.key === 'per_protocol_misread' && f.round === 'r392'), 'gate 桥族表含 per_protocol_misread');
  ok(gFams.length === 42, `gate 桥族表 42 族（实际 ${gFams.length}）`);
  const an = plugin.analyze(ATTACKS[4]);
  ok(an.families.some(x => x.key === 'per_protocol_misread'), `analyze 归因 per_protocol_misread（${an.families.map(x => x.key).join(',')}）`);
  ok(an.score > 0.5, `analyze score ${an.score}`);
}

// ═══ 测试 7：射程不重叠——与既有子族/维度对照 ═══
console.log('\n[7] 射程不重叠对照');
{
  const cases = [
    // proxy_metric_goal（dim187）领地：业务度量读数
    ['proxy_metric_goal', 'DAU 和点击率涨了，说明产品目标已经达成，用户需求被满足了。'],
    ['proxy_metric_goal', '免疫接种覆盖率上去了，说明公共卫生问题已经解决了。'],
    ['proxy_metric_goal', '只统计点击了广告的用户，转化率非常高，说明营销有效。'],
    // confounding_by_indication（r339）领地：治疗分配混杂
    ['confounding_by_indication', '医生倾向于给病情更重的人用新药，两组结局不同说明新药有效。'],
    ['confounding_by_indication', '重症患者才用上了新药，所以他们的结局差不能全怪药效不好。'],
    // healthy_user_bias（r372）领地：行为群体归因（射程解剖对象）
    ['healthy_user_bias', '吃维生素的人更健康，所以维生素能让人更健康。'],
    ['healthy_user_bias', '坚持复诊的病人死亡率更低，所以定期复查能延寿。'],
    // weak_evidence_strong_claim（dim245）领地：弱证据类型
    ['weak_evidence_strong_claim', '只有三个病例，但足以证明这个疗法彻底治愈了癌症。'],
    // effect_measure_misread（r386）领地：OR/HR 口径
    ['effect_measure_misread', 'OR=2.1，说明风险是普通人的2.1倍。'],
    // significance_verdict_misread（r387）领地：显著性裁定
    ['significance_verdict_misread', 'p=0.049，说明效应确实存在。'],
    // censoring_neglect（r388）领地：删失数据
    ['censoring_neglect', '随访满一年全部健在，可以宣告新药更安全。'],
    // surrogate_endpoint_misread（r389）领地：替代终点兑换
    ['surrogate_endpoint_misread', '肿瘤标志物水平下降了，证明治疗对病人有实质性好处。'],
    // relative_risk_individual_transfer 领地：群体相对风险平移
    ['relative_risk_individual_transfer', '人群相对风险翻倍，所以你得病的概率就是别人的两倍。'],
  ];
  for (const [fam, t] of cases) {
    ok(detectPerProtocolMisread(t).hit === false, `${fam} 领地不判`);
  }
}

// ═══ 测试 8：负例注入-删条（承重证明）══════════════════════
console.log('\n[8] 负例注入-删条（承重）');
const INJECT_KEY = __internals();
const LEG1 = ['POP_ZH_P1', 'POP_ZH_P2', 'POP_ZH_P3', 'POP_ZH_P3B', 'POP_ZH_P4', 'POP_ZH_P5', 'POP_ZH_P5B', 'POP_ZH_P6', 'POP_ZH_P7', 'POP_ZH_P8', 'POP_ZH_P9', 'POP_EN_G1', 'POP_EN_G2', 'POP_EN_G3', 'POP_EN_G4', 'POP_EN_G5', 'POP_EN_G6'];
const LEG2 = ['EFF_ZH_E1', 'EFF_ZH_E2', 'EFF_ZH_E3', 'EFF_ZH_E4', 'EFF_ZH_E5', 'EFF_EN'];
const PROBE = ATTACKS[4]; // 只统计按方案用药的人群，新药的效果非常确凿。
function nullify(keys) { const o = {}; for (const k of keys) o[k] = /(?!)/i; return o; }
const ALL_MATCH_KEYS = Object.keys(INJECT_KEY).filter(k => k !== 'findSignatures');

ok(detectPerProtocolMisread(PROBE).hit === true, '注入前应命中（前提）');
{
  const after = detectPerProtocolMisread(PROBE, nullify(ALL_MATCH_KEYS));
  ok(after.hit === false, 'C1 全键注入 → 家族从命中消失');
}
{
  const after = detectPerProtocolMisread(PROBE, nullify(LEG1));
  ok(after.hit === false, 'C2 腿① POP 全注入 → 家族消失（腿①承重）');
}
{
  const after = detectPerProtocolMisread(PROBE, nullify(LEG2));
  ok(after.hit === false, 'C3 腿② EFF 全注入 → 家族消失（腿②承重）');
}
{
  // 豁免承重：概念教学/正确方法论默认豁免，注入后必须转命中
  //   （措辞避开 HEDGE/CONCEPT 交叠词——「不等于/不意味着」两表都有，
  //     单注 CONCEPT 不翻；CONCEPT 独有形用「区别/distinct from」，
  //     CORRECT 独有形用「结果一致/agreed」）
  const proofs = [
    ['CONCEPT_ZH', '教学案例里常把按方案分析与意向性治疗的区别讲清楚：只统计按方案用药的人群，新药的效果非常确凿。'],
    ['CONCEPT_EN', 'In teaching, a per-protocol set is distinct from the ITT population: counting only those who took the drug as prescribed, the drug clearly worked.'],
    ['CORRECT_ZH', '按方案集与意向性治疗分析的结果一致，都显示风险下降；但单看只统计按方案用药的人群，新药的效果非常确凿。'],
    ['CORRECT_EN', 'The per-protocol set and the ITT set agreed, both showing a risk reduction; looking only at those who finished the program, the drug clearly worked.'],
  ];
  for (const [k, s] of proofs) {
    const d = detectPerProtocolMisread(s);
    ok(d.hit === false, `C4 ${k} 默认应豁免`);
    ok(detectPerProtocolMisread(s, nullify([k])).hit === true, `C4 ${k} 注入后应转命中`);
  }
}
{
  // 腿①否定守卫承重：「不能只看坚持服药的人」默认不判，注入 NEG1 后转命中
  const neg1 = '不能只看坚持服药的人，还要看全体受试者，这样才说明药物确实有效。';
  ok(detectPerProtocolMisread(neg1).hit === false, 'C5 NEG1 默认应豁免（腿①否定守卫）');
  ok(detectPerProtocolMisread(neg1, nullify(['NEG1_ZH', 'NEG1_EN'])).hit === true, 'C5 NEG1 注入后应转命中');
}
{
  // 腿②紧前否定/对冲守卫承重：默认不判，注入后转命中
  //   （「并不等于」同现于 HEDGE_ZH 后置窗与 CONCEPT_ZH 框架词，故
  //     NEG/HEDGE/CONCEPT 三表一并注入才露出承重——r389 C7 同款教训）
  const hedged = '只统计按方案用药的人群，新药的效果非常确凿，但这并不等于真实疗效。';
  ok(detectPerProtocolMisread(hedged).hit === false, 'C6 NEG/HEDGE 默认应豁免（腿②双守卫）');
  ok(detectPerProtocolMisread(hedged, nullify(['NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN', 'CONCEPT_ZH', 'CONCEPT_EN'])).hit === true, 'C6 NEG/HEDGE 注入后应转命中');
}

// ═══ 汇总 ═══
console.log(`\n${'='.repeat(50)}`);
console.log(`r392 单测结果: ${pass} PASS / ${fail} FAIL`);
console.log(`${'='.repeat(50)}`);
if (fail > 0) {
  console.log('存在 FAIL，按纪律不 commit');
  process.exit(1);
}
console.log('全绿');
