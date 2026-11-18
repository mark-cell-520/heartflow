/**
 * test/round-389-surrogate-endpoint-misread.test.js
 * r389 轮单测：surrogate_endpoint_misread 第 46 子族（替代终点误读）
 *
 * 轮次背景：选题库续统计素养轴，定拨「替代终点误读」（surrogate endpoint
 * misread / surrogate-to-hard-endpoint leap——把血压/血脂/LDL/糖化血红
 * 蛋白/肿瘤标志物/骨密度/抗体滴度/病毒载量 等中间指标的改善直接当成
 * 预防心梗/中风/骨折/死亡、延长寿命、降低死亡率、临床获益的证明）。
 * 同池 11 候选两段定拨穿透 24/45 真零命中（一段 7/18 + 二段 17/27）
 * 为全场最高；良性 20 条模块层零误伤。海外扫描 GitHub 21 条命中全为
 * 替代终点评估统计包（surrosurv/Surrogate/Surrogacy-analysis 等，
 * 0-1 star）、arXiv 15 条全为物理/ML surrogate model、S2 连续 429
 * ——按既有形态自建（docstring 已记录）。
 *
 * 三层验证（同 r386/r388 范式）：
 *   1. 模块级 detectSurrogateEndpointMisread 直接调用
 *   2. gate 层 mainGate.gate 归因（econ_reasoning_gate 聚合族承重）
 *   3. 插件层注册（version / family 列表）
 *   4. 负例注入-删条（承重证明：两腿/推断标记/双豁免/双守卫）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const mainGate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = mainGate.gate || mainGate.check;
const { detectSurrogateEndpointMisread, __internals } = require(path.join(ROOT, 'src', 'surrogate-endpoint-misread.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const gate = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS ' + msg); }
  else { fail++; console.log('  FAIL ' + msg); }
}

// ─── 攻击样本：替代终点误读（中英双语，探针穿透 24/45 的样本集）─────
const ATTACKS = [
  // ZH
  '肿瘤标志物水平下降了，证明治疗对病人有实质性好处。',
  '骨密度提高了，所以这种疗法能降低骨折风险。',
  '糖化血红蛋白降下来了，说明患者的心血管结局会改善。',
  '生物标志物改善就是疗效，说明药物在临床上取得了成功。',
  '血脂指标恢复正常，等于患者的心脏病风险解除了。',
  '只要替代终点改善，患者最终的生存就会受益。',
  '疫苗诱导了很高的抗体滴度，所以它一定能防住感染。',
  '新药让 LDL 胆固醇降了四成，可见它能预防心梗。',
  '血压控制住了，说明中风风险随之消失。',
  '肿瘤缩小了三分之一，这意味着患者能活得更久。',
  '病毒载量检测不到，所以病人已经算治愈了。',
  '糖化血红蛋白达标，足以证明患者的寿命会延长。',
  '骨密度T值上去了，可见老年人就不会骨折了。',
  '抗体转阴，说明病毒已经被彻底清除了，病人没有健康隐患。',
  '影像上病灶完全缓解，因此这种疗法的临床价值已经确证。',
  '转氨酶恢复正常，等于肝病的长期风险解除了。',
  // EN
  'Higher antibody titers mean the vaccine will protect against infection.',
  'The drug cut LDL cholesterol by 40%, so it will prevent heart attacks.',
  'Blood pressure came down, which means stroke risk is gone.',
  'The tumor shrank by a third, so patients will live longer.',
  'The viral load is undetectable, therefore the patient is cured.',
  'HbA1c reached target, proving that patients will live longer.',
  'Bone density T-scores improved, so elderly patients will not fracture.',
  'Complete response on imaging confirms the clinical value of the therapy.',
  'Liver enzymes normalized, meaning the long-term risk of liver disease is resolved.',
  'The biomarker improved, therefore survival must improve too.',
  'Since the surrogate endpoint improved, patients clearly benefit.',
];

// ─── 良性样本：谨慎陈述 / 概念教学 / 仍需终点证据 / 腿①否定守卫形 ──
const BENIGNS = [
  '替代终点的改善不一定转化为临床获益，仍需硬终点证据。',
  '血压下降只是中间指标，能否减少中风还要看终点试验。',
  '生物标志物变化只是替代终点，不能直接说明患者活得更长。',
  'LDL 降下来了不等于心脏病发作减少，心血管结局试验还没做。',
  '肿瘤缩小是影像学缓解，与总生存的改善不是一回事。',
  '这个药改善了糖化血红蛋白，但硬终点数据尚未公布。',
  '抗体滴度升高只说明免疫反应存在，保护效力要靠临床终点。',
  '生存分析要看硬终点，替代终点只能作为辅助证据。',
  '他不去医院检查，所以血压一直没降下来，风险自然高。',
  '虽然坚持服药，他的肿瘤标志物仍然升高，说明病情在进展。',
  '该疗法的替代终点结果发表于去年，硬终点试验仍在进行。',
  '骨密度指标改善，但试验的主要终点是全骨折发生率，我们尚未看到数据。',
  'Surrogate endpoint improvement does not guarantee benefit on hard clinical endpoints.',
  'Lower LDL does not by itself mean fewer heart attacks; outcome trials are pending.',
  'Tumor shrinkage is a radiological response, not the same as improved overall survival.',
  'Antibody titers rose, but protection against disease requires clinical endpoints.',
  'The drug improved HbA1c, but hard endpoint data have not been published yet.',
  'Surrogate endpoints can mislead; we need mortality and morbidity outcomes.',
  'Because he skipped the checkups, his blood pressure stayed high and risk rose.',
  'Although adherent, his tumor markers kept rising, so the disease progressed.',
];

// ═══ 测试 1：模块级攻击全命中 ═══
console.log('\n[1] 模块级 detectSurrogateEndpointMisread — 攻击样本');
ATTACKS.forEach((t, i) => {
  const r = detectSurrogateEndpointMisread(t);
  ok(r.hit === true, `A${i + 1} hit（score=${r.score}, count=${r.count}）`);
});

// ═══ 测试 2：模块级良性零误伤 ═══
console.log('\n[2] 模块级 detectSurrogateEndpointMisread — 良性样本零误伤');
BENIGNS.forEach((t, i) => {
  const r = detectSurrogateEndpointMisread(t);
  ok(r.hit === false, `B${i + 1} 不命中`);
});

// ═══ 测试 3：命中结构完整性 ═══
console.log('\n[3] 命中结果结构完整性');
{
  const r = detectSurrogateEndpointMisread(ATTACKS[0]);
  ok(r.dimension === 'surrogate_endpoint_misread', 'dimension 字段正确');
  ok(typeof r.severity === 'number' && r.severity >= 60 && r.severity <= 100, `severity 在 60-100（${r.severity}）`);
  ok(typeof r.guidance === 'string' && r.guidance.length > 100, 'guidance 非空且充实');
  ok(Array.isArray(r.evidence) && r.evidence.length >= 1, 'evidence 数组非空');
  ok(Array.isArray(r.tags) && r.tags.includes('surrogate-endpoint'), 'tags 含 surrogate-endpoint');
}

// ═══ 测试 4：gate 层归因（econ_reasoning_gate 聚合族承重）═════
console.log('\n[4] gate 层归因');
{
  let econAttr = 0;
  let nonPass = 0;
  ATTACKS.forEach((t) => {
    const r = gcheck(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (dims.includes('econ_reasoning_gate')) { econAttr++; }
    if (r.gate && r.gate.action !== 'pass') { nonPass++; }
  });
  ok(nonPass === ATTACKS.length, `gate 层 action 非 pass ${nonPass}/${ATTACKS.length}`);
  ok(econAttr === ATTACKS.length, `gate 层 econ_reasoning_gate 归因 ${econAttr}/${ATTACKS.length}`);
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
  ok(plugin.version === '1.22.0', `version=1.22.0（${plugin.version}）`);
  const desc = String(plugin.description || '');
  ok(desc.includes('surrogate_endpoint_misread'), 'description 含 surrogate_endpoint_misread');
  ok(desc.includes('r389'), 'description 含 r389');
  ok(desc.includes('46 族'), 'description 标注 46 族');
  ok(plugin.FAMILIES.some(f => f.key === 'surrogate_endpoint_misread' && f.round === 'r389'), 'FAMILIES 含 surrogate_endpoint_misread（round r389）');
  ok(plugin.FAMILIES.length === 46, `FAMILIES 46 族（实际 ${plugin.FAMILIES.length}）`);
  const econN = plugin.FAMILIES.filter(f => f.group === 'econ').length;
  const statsN = plugin.FAMILIES.filter(f => f.group === 'stats').length;
  ok(econN === 36, `econ 组 36 族（实际 ${econN}）`);
  ok(statsN === 10, `stats 组 10 族（实际 ${statsN}）`);
  ok(new Set(plugin.FAMILIES.map(f => f.key)).size === 46, 'FAMILIES key 唯一');
  const gFams = gate.FAMILIES;
  ok(gFams.some(f => f.key === 'surrogate_endpoint_misread' && f.round === 'r389'), 'gate 桥族表含 surrogate_endpoint_misread');
  ok(gFams.length === 41, `gate 桥族表 41 族（实际 ${gFams.length}）`);
  const an = plugin.analyze(ATTACKS[0]);
  ok(an.families.some(x => x.key === 'surrogate_endpoint_misread'), `analyze 归因 surrogate_endpoint_misread（${an.families.map(x => x.key).join(',')}）`);
  ok(an.score > 0.5, `analyze score ${an.score}`);
}

// ═══ 测试 7：射程不重叠——与既有子族/维度对照 ═══
console.log('\n[7] 射程不重叠对照');
{
  const cases = [
    // proxy_metric_goal（dim187）领地：业务度量读数
    ['proxy_metric_goal', 'DAU 和点击率涨了，说明产品目标已经达成，用户需求被满足了。'],
    ['proxy_metric_goal', '免疫接种覆盖率上去了，说明公共卫生问题已经解决了。'],
    // confounding_by_indication（r339）领地：治疗分配混杂
    ['confounding_by_indication', '医生倾向于给病情更重的人用新药，两组结局不同说明新药有效。'],
    // healthy_user_bias（r372）领地：行为群体归因
    ['healthy_user_bias', '吃维生素的人更健康，所以维生素能让人更健康。'],
    // weak_evidence_strong_claim（dim245）领地：弱证据类型
    ['weak_evidence_strong_claim', '只有三个病例，但足以证明这个疗法彻底治愈了癌症。'],
    // effect_measure_misread（r386）领地：OR/HR 口径
    ['effect_measure_misread', 'OR=2.1，说明风险是普通人的2.1倍。'],
    // significance_verdict_misread（r387）领地：显著性裁定
    ['significance_verdict_misread', 'p=0.049，说明效应确实存在。'],
    // censoring_neglect（r388）领地：删失数据
    ['censoring_neglect', '随访满一年全部健在，可以宣告新药更安全。'],
    // relative_risk_individual_transfer 领地：群体相对风险平移
    ['relative_risk_individual_transfer', '人群相对风险翻倍，所以你得病的概率就是别人的两倍。'],
  ];
  for (const [fam, t] of cases) {
    ok(detectSurrogateEndpointMisread(t).hit === false, `${fam} 领地不判`);
  }
}

// ═══ 测试 8：负例注入-删条（承重证明）══════════════════════
console.log('\n[8] 负例注入-删条（承重）');
const INJECT_KEY = __internals();
const LEG1 = ['SURROGATE_ZH', 'SURROGATE_EN'];
const LEG2 = ['HARD_ZH', 'HARD_EN'];
const PROBE = ATTACKS[0]; // 肿瘤标志物水平下降了，证明治疗对病人有实质性好处。
function nullify(keys) { const o = {}; for (const k of keys) o[k] = /(?!)/i; return o; }
const ALL_MATCH_KEYS = Object.keys(INJECT_KEY).filter(k => k !== 'findSignatures');

ok(detectSurrogateEndpointMisread(PROBE).hit === true, '注入前应命中（前提）');
{
  const after = detectSurrogateEndpointMisread(PROBE, nullify(ALL_MATCH_KEYS));
  ok(after.hit === false, 'C1 全键注入 → 家族从命中消失');
}
{
  const after = detectSurrogateEndpointMisread(PROBE, nullify(LEG1));
  ok(after.hit === false, 'C2 腿① SURROGATE 全注入 → 家族消失（腿①承重）');
}
{
  const after = detectSurrogateEndpointMisread(PROBE, nullify(LEG2));
  ok(after.hit === false, 'C3 腿② HARD 全注入 → 家族消失（腿②承重）');
}
{
  const after = detectSurrogateEndpointMisread(PROBE, nullify(['INFER_ZH', 'INFER_EN']));
  ok(after.hit === false, 'C4 推断标记全注入 → 家族消失（推断连接承重）');
}
{
  // 豁免承重：概念教学/纠正句默认豁免，注入后必须转命中
  //   （措辞注意避开 HEDGE/CONCEPT 交叠词——"不意味着/不等于"两表都有，
  //     单注 CONCEPT 不翻；CONCEPT 独有形用"区别/讨论/distinct from"，CORRECT 独有形用"仍在进行/still ongoing"）
  const proofs = [
    ['CONCEPT_ZH', '教学案例里常把替代终点与硬终点的区别讲清楚：血压下降说明患者寿命延长。'],
    ['CONCEPT_EN', 'In teaching, a surrogate endpoint is distinct from a hard endpoint: blood pressure came down, which means patients live longer.'],
    ['CORRECT_ZH', '这种药的糖化血红蛋白降下来了，但心血管结局试验仍需更长时间的终点数据，说明患者寿命会延长。'],
    ['CORRECT_EN', 'Blood pressure came down, but the hard endpoint trial is still ongoing, so patients will live longer.'],
  ];
  for (const [k, s] of proofs) {
    const d = detectSurrogateEndpointMisread(s);
    ok(d.hit === false, `C5 ${k} 默认应豁免`);
    ok(detectSurrogateEndpointMisread(s, nullify([k])).hit === true, `C5 ${k} 注入后应转命中`);
  }
}
{
  // 腿①否定守卫承重：「血压一直没降下来」默认不判，注入 NEG1 后转命中
  //   （r389 实测修正：守卫查 interior——锚与方向词之间，"一直没"）
  const neg1 = '血压一直没降下来，所以患者的心脏病风险解除了。';
  ok(detectSurrogateEndpointMisread(neg1).hit === false, 'C6 NEG1 默认应豁免（腿①否定守卫）');
  ok(detectSurrogateEndpointMisread(neg1, nullify(['NEG1_ZH', 'NEG1_EN'])).hit === true, 'C6 NEG1 注入后应转命中');
}
{
  // 腿②紧前否定/对冲守卫承重：默认不判，注入后转命中
  //   （「不意味着」同现于 NEG_ZH 前置窗与 HEDGE_ZH，且 CONCEPT_ZH 也收该词，
  //     故 NEG/HEDGE/CONCEPT 三表一并注入才露出承重——r389 实测）
  const hedged = 'LDL 降下来了，但这并不意味着能预防心梗。';
  ok(detectSurrogateEndpointMisread(hedged).hit === false, 'C7 NEG/HEDGE 默认应豁免（腿②双守卫）');
  ok(detectSurrogateEndpointMisread(hedged, nullify(['NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN', 'CONCEPT_ZH', 'CONCEPT_EN'])).hit === true, 'C7 NEG/HEDGE 注入后应转命中');
}

// ═══ 汇总 ═══
console.log(`\n${'='.repeat(50)}`);
console.log(`r389 单测结果: ${pass} PASS / ${fail} FAIL`);
console.log(`${'='.repeat(50)}`);
if (fail > 0) {
  console.log('存在 FAIL，按纪律不 commit');
  process.exit(1);
}
console.log('全绿');
