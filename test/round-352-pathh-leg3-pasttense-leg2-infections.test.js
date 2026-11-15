'use strict';
/**
 * test/round-352-pathh-leg3-pasttense-leg2-infections.test.js
 * [r352] 路径 (h) 两个新措辞家族（真升级类型②：已有维度的全新措辞家族，
 * 维度计数 256 不变、src/index.js 零改动、VERSION 6.8.185 不 bump，同
 * r339–r351 先例：族内补形不 bump）。
 *
 * r352 立项探针（coordination/agent4/probes/r352-probe-candidates.js，集成
 * 树 v6.8.185 gate() 全量 findings 口径）四候选定拨：
 *   候选 A 腿③过去时推断词/was 系动词形：攻击 8/8 穿透、良性 6/6 中 2 条
 *     非 pass 均为无路径 h 腿句子被既有维度（fallacy_of_relevance /
 *     confidence）代拦的基线误伤、模块级路径 h FP 0 → 落地（本轮）；
 *   候选 B 腿① sensitive/advanced/improved + testing 名词形：攻击 5/7
 *     穿透（2 条被 DETECT_UP_EN p5 自锚代拦）、良性 1/6 为 post_hoc 既有
 *     基线 → 穿透率低于 A 且与 p5 自锚形交错，本轮不立项（留交接）；
 *   候选 C 腿②单助动词形 × infections/illnesses 名词族：攻击 4/5 穿透
 *     （1 条被 fallacy_of_relevance 代拦）、良性 4/4 零误伤 → 落地（本轮）；
 *   候选 D Berkson 住院选择形（collider_bias COND_EN 缺 hospitalized/
 *     inpatient）6/10 穿透、需改共享常量 COND_EN → 不立项（留交接）。
 * 中文侧探针：腿③过去时形无时态对应（INCIDENCE_CLAIM_ZH p3/p5 的 表明/
 * 说明/证明 族已覆盖同形）、腿② infections/illnesses 名词族同形已被
 * immortal_time_bias 代拦，两个新族均 EN 专项。
 * 海外扫描：arXiv parse-fail、GitHub total_count 0 空返、S2 空返——按
 * 既有形态自建，未编造命中。
 *
 * 补丁（src/immortal-time-bias.js，既有路径与常量零改动，只追加 + 主块
 * 接线 + __internals 登记）：
 *   · 新增 INCIDENCE_CLAIM_EN3（腿③第三族 3 形：p1 过去时推断词 +
 *     disease + was/were + spreading/more common/on the rise；p2 过去时
 *     推断词 + incidence/prevalence/rate + was/were + rising 类；p3 裸
 *     系词形 disease/epidemic + was/were + (adv)? + spreading 类）；
 *   · 新增 CASE_SURGE_EN5（腿②第五族 5 形：p1a illnesses + 全助动词组；
 *     p1b infections + 剔除 got/getting 的助动词组；p2 number-of 名词
 *     前置形；p3 检出形容词 + has/have + 激增动词形；p4 检出动词前置形；
 *     动词表取 legacy p9 与 EN3 p4 并集）；
 *   · 路径 (h) 主块腿②五族、腿③三族取最早匹配。
 * 族独立常量（EN3/EN5 后缀）而非追加既有家族表：r346–r351 六轮测以精确
 * equality/注入钉死既有常量元素数与承重（CASE_SURGE_EN 恰 12、
 * INCIDENCE_CLAIM_EN 恰 10、CASE_SURGE_EN3 恰 6、CASE_SURGE_EN4 恰 3
 * 等），追加会打破存量断言——独立族零触碰存量测试（r338/r348–r351 先例）。
 *
 * 实现教训（本轮一条，已写入代码注释）：① 腿② p1a 初版动词表只抄 legacy
 * p9（detected/diagnosed/found/identified/reported），漏 picked up——
 * "many more illnesses got picked up" 穿透（EN3 p4/p5 名词表只收
 * infections 不收 illnesses），按纪律取 legacy p9 与 EN3 p4 动词并集补入。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 gate+模块 + 官方
 *   语料全量 + 既有基线句隔离）/ D 存量回归（r346–r351 + 路径 a-g + 常量
 *   元素数）/ E 常量级注入-删条承重（逐族 + 窗 + 族隔离双向硬探针）/ F 边界
 *   锁 / G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { checkImmortalTimeBias, __internals: immortalInternals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hitI = (t, inj) => checkImmortalTimeBias(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击集 ─────────────────────────────────────────────────────────
// 腿③过去时族（EN 11：探针 8 + 扩展 3——incidence/prevalence + was、
// epidemic 裸系词形）
const ATTACK_L3 = [
  'After the screening program expanded, far more cases were being diagnosed each year, which showed the disease was truly spreading.',
  'With the growing use of MRI, far more lesions are being detected, which demonstrated the disease was really becoming more widespread.',
  'As CT scanning became universal, numerous additional cases are being identified, and the data showed the illness was genuinely on the rise.',
  'Ubiquitous testing means many more infections are being caught, which proved the disease was truly becoming more common.',
  'With wider screening uptake, many more tumors are being picked up, and the results suggested the cancer was really spreading.',
  'Thanks to ubiquitous testing, a growing number of cases is being detected, which revealed the disease was genuinely becoming more widespread.',
  'Mass screening campaigns mean numerous additional cases are being surfaced, revealing that the disease was truly spreading.',
  'With wider screening, many more cases were brought to light, and it became clear the disease was truly on the rise.',
  // 扩展形：推断词 + incidence/prevalence + was
  'After the screening program expanded, far more cases were being diagnosed each year, which showed the incidence was truly rising.',
  'With wider screening, many more cases were brought to light, and the data showed the prevalence was genuinely climbing.',
  // 扩展形：裸系词 + epidemic
  'Mass screening campaigns mean numerous additional cases are being surfaced, revealing that the epidemic was truly on the rise.',
];
// 腿② infections/illnesses 单助动词族（EN 8：探针 5 + 扩展 3——illnesses
// got picked up、new infections have surged、number of newly identified
// illnesses has doubled）
const ATTACK_L2 = [
  'Thanks to ubiquitous testing, many more infections have been identified, which suggests the disease is really becoming more widespread.',
  'With wider screening, far more illnesses have been detected, indicating the disease is genuinely on the rise.',
  'With wider screening, reported illnesses have tripled, suggesting the disease is really becoming more common.',
  'Screening identified many more infections, which suggests the disease is really on the rise.',
  'With wider screening, the number of identified infections has surged, which proves the disease is truly spreading.',
  'Thanks to ubiquitous testing, many more illnesses got picked up, which suggests the disease is really becoming more widespread.',
  'With wider screening, new infections have surged, which proves the disease is truly spreading.',
  'With wider screening, the number of newly identified illnesses has doubled, suggesting the disease is really becoming more common.',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：腿③过去时族攻击 11/11 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L3) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿② infections/illnesses 族攻击 8/8 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：腿③族 EN 11/11 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of ATTACK_L3) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});
check('B 模块直调：腿②族 EN 8/8 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of ATTACK_L2) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // 腿③孪生：过去时结论 + 旧豁免族兜底（true/underlying/actual incidence stable / does not appear to be rising）
  'After the screening program expanded, far more cases were being diagnosed each year, which showed the disease was truly spreading — though the true incidence appears stable once ascertainment is accounted for.',
  'With the growing use of MRI, far more lesions are being detected, which demonstrated the disease was really becoming more widespread — but the actual prevalence does not appear to be rising.',
  'As CT scanning became universal, numerous additional cases are being identified, and the data showed the illness was genuinely on the rise — though the real incidence seems unchanged once ascertainment is accounted for.',
  // 腿②孪生：单助动词 infections/illnesses + 旧豁免族兜底
  'Thanks to ubiquitous testing, many more infections have been identified, yet the underlying rate appears stable.',
  'With wider screening, far more illnesses have been detected, but the actual prevalence does not appear to be rising.',
  // 良性陈述（无发生率结论腿或无病例激增腿）
  'Screening identified many more infections, and the lab validated the results with confirmatory assays.',
  'The lab reports that identified infections have increased after the new assay was introduced.',
  '会议纪要显示，模型推演中这种疾病过去确实在蔓延，团队决定增加备货。',
  'The radiology department reports that more images are being processed per day after the system upgrade.',
  '随着检测流程改造，更多样本正在被检测，实验室周转时间明显缩短。',
];
check('C 良性零误伤：两新族手工良性 10/10 gate 层 pass 且模块级不判', () => {
  for (const s of BENIGN) {
    assert.strictEqual(gate(s).gate.action, 'pass', 'gate 层误伤: ' + s);
    assert.strictEqual(hitI(s), false, '模块级误判: ' + s);
  }
});
check('C 良性零误伤：官方四基准语料全量模块级路径 h 零命中', () => {
  function flatten(mod) {
    const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
    if (Array.isArray(src)) out.push(...src);
    else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
    return out.filter(s => typeof s === 'string');
  }
  let n = 0, fp = 0; const hits = [];
  for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
    for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
      n++;
      const r = checkImmortalTimeBias(s);
      if (r.hit && (r.detail.includes('过度诊断发生率误读') || r.detail.includes('overdiagnosis-incidence'))) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  assert.ok(n >= 360, '语料条数不足: ' + n);
  assert.strictEqual(fp, 0, '路径 h 误伤 ' + fp + ' 条: ' + hits.join(' | '));
});
// 探针中 2 条无路径 h 腿的句子被既有维度（fallacy_of_relevance / confidence）
// 代拦——立项探针已实证为既有基线（非本族新增），这里钉死模块级路径 h 不判
const BASELINE_FP = [
  'The audit report showed the disease was truly spreading in the modeled scenario, so the team expanded the testing budget.',
  'The simulation revealed that the disease was truly spreading under the worst-case assumptions, according to the modeling team.',
];
check('C 既有基线隔离：2 条无腿句子 gate 层非 pass 均由既有维度承重、模块级路径 h 不判', () => {
  for (const s of BASELINE_FP) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '应仍被既有维度代拦: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(!f, '不应由 immortal_time_bias 承重: ' + s);
    assert.strictEqual(hitI(s), false, '模块级误判: ' + s);
  }
});

// ─── D. 存量回归 ──────────────────────────────────────────────────
check('D 存量回归：r346–r351 路径 h 攻击仍命中（注入两新族置空不受影响）', () => {
  const stock = [
    // r346 腿② legacy 激增形 + 腿③现在时（EN 3 + 推断词族）
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    // r346 ZH 2
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
    // r347 腿①检出能力变动 + 腿②旧族（EN 3）
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    'Since screening expanded, far more cases have been detected, and the incidence appears to be climbing.',
    // r348 腿②被动浮现 EN2（are now found 形——新族不得 rescue）
    'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
    'As screening became more widespread, many more tumors were caught, and the disease appears to be spreading.',
    // r348 ZH 2
    '筛查项目的铺开让大量潜伏病例浮出水面，可见这种疾病真的在蔓延。',
    '检查的普及使更多病例被及时发现，新发病例激增，足以证明患病率真的升高了。',
    // r349 腿②被动深形 EN3（brought to light / got picked up / silent infections）
    'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
    'Thanks to better surveillance, far more infections got picked up, indicating the disease is truly on the rise.',
    'Population screening brought numerous hidden infections to light, proving the illness is genuinely on the rise.',
    // r349 ZH 2
    '普筛铺开让许多既往漏掉的病例被重新发现，足以证明疾病真的在蔓延。',
    '筛查推广后大量隐藏病例被带进视野，可见患病率真的在上升。',
    // r350 腿①名词化（DETECT_UP_EN4/ZH4）+ 腿② legacy
    'The widespread adoption of CT scans has identified many more tumors, which shows the cancer is truly becoming more prevalent.',
    'Mass testing campaigns have detected many more cases, which suggests the disease is truly spreading.',
    '排查力度的加强让更多病例被发现，可见疾病真的在蔓延。',
    '监测力度的加大让更多病例浮出水面，说明患病率真的在上升。',
    // r351 腿②双助动词 EN4（新腿②族不得 rescue 双助动词形）
    'With the growing use of MRI, far more lesions are being detected, suggesting the disease is really spreading.',
    'As CT scanning became universal, numerous additional cases are being identified, indicating the illness is genuinely on the rise.',
    'Once mass testing began, many more infections were being identified, suggesting the illness is really becoming more common.',
    'Thanks to ubiquitous testing, a growing number of cases is being detected, which suggests the disease is really on the rise.',
  ];
  for (const s of stock) {
    assert.strictEqual(hitI(s), true, '存量回归失效: ' + s);
    assert.strictEqual(hitI(s, { CASE_SURGE_EN5: [], INCIDENCE_CLAIM_EN3: [] }), true, '被新族置空误伤: ' + s);
  }
});
check('D 存量回归：路径 (a)(d)(e)(f)(g) 攻击仍命中', () => {
  assert.ok(checkImmortalTimeBias('治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。').hit, '路径 a 回归');
  assert.ok(checkImmortalTimeBias('肿瘤早筛让确诊时间平均提前了两年，患者的五年生存率因此大幅上升，可见筛查显著延长了寿命。').detail.includes('领先时间偏误'), '路径 d 回归');
  assert.ok(checkImmortalTimeBias('筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，这说明筛查确实有效。').detail.includes('病程长度偏误'), '路径 e 回归');
  assert.ok(checkImmortalTimeBias('早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。').detail.includes('过度诊断×'), '路径 f 回归');
  assert.ok(checkImmortalTimeBias('新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后。').detail.includes('Will Rogers'), '路径 g 回归');
});
check('D 存量回归：既有路径 h 常量元素数与窗值不变（族独立常量零触碰）', () => {
  const I = immortalInternals();
  assert.strictEqual(I.CASE_SURGE_EN.length, 12, 'CASE_SURGE_EN 应保持 12');
  assert.strictEqual(I.INCIDENCE_CLAIM_EN.length, 10, 'INCIDENCE_CLAIM_EN 应保持 10');
  assert.strictEqual(I.EXEMPT_INC_EN.length, 10, 'EXEMPT_INC_EN 应保持 10');
  assert.strictEqual(I.CASE_SURGE_ZH.length, 1, 'CASE_SURGE_ZH 应保持 1');
  assert.strictEqual(I.INCIDENCE_CLAIM_ZH.length, 7, 'INCIDENCE_CLAIM_ZH 应保持 7');
  assert.strictEqual(I.EXEMPT_INC_ZH.length, 5, 'EXEMPT_INC_ZH 应保持 5');
  assert.strictEqual(I.DETECT_UP_EN.length, 5, 'DETECT_UP_EN 应保持 5');
  assert.strictEqual(I.DETECT_UP_ZH.length, 2, 'DETECT_UP_ZH 应保持 2');
  assert.strictEqual(I.CASE_SURGE_EN2.length, 5, 'CASE_SURGE_EN2 应保持 5');
  assert.strictEqual(I.CASE_SURGE_ZH2.length, 1, 'CASE_SURGE_ZH2 应保持 1');
  assert.strictEqual(I.INCIDENCE_CLAIM_EN2.length, 5, 'INCIDENCE_CLAIM_EN2 应保持 5');
  assert.strictEqual(I.INCIDENCE_CLAIM_ZH2.length, 2, 'INCIDENCE_CLAIM_ZH2 应保持 2');
  assert.strictEqual(I.EXEMPT_INC_ZH2.length, 1, 'EXEMPT_INC_ZH2 应保持 1');
  assert.strictEqual(I.EXEMPT_INC_EN2.length, 1, 'EXEMPT_INC_EN2 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN3.length, 6, 'CASE_SURGE_EN3 应保持 6');
  assert.strictEqual(I.CASE_SURGE_ZH3.length, 2, 'CASE_SURGE_ZH3 应保持 2');
  assert.strictEqual(I.DETECT_UP_EN4.length, 6, 'DETECT_UP_EN4 应保持 6');
  assert.strictEqual(I.DETECT_UP_ZH4.length, 3, 'DETECT_UP_ZH4 应保持 3');
  assert.strictEqual(I.CASE_SURGE_EN4.length, 3, 'CASE_SURGE_EN4 应保持 3');
  assert.strictEqual(I.LEAD_SCREEN_ZH.length, 2, 'LEAD_SCREEN_ZH 不应被改');
  assert.strictEqual(I.LEAD_SCREEN_EN.length, 5, 'LEAD_SCREEN_EN 不应被改');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
let flipCount = 0, flipTotal = 0;
const flip = (cond, msg) => { flipTotal++; if (cond) flipCount++; else throw new Error(msg); };
check('E 注入 INCIDENCE_CLAIM_EN3=[] → 腿③过去时族攻击 11/11 翻转不判', () => {
  for (const s of ATTACK_L3) flip(hitI(s, { INCIDENCE_CLAIM_EN3: [] }) === false, '删 INCIDENCE_CLAIM_EN3 后仍命中: ' + s);
});
check('E 注入 CASE_SURGE_EN5=[] → 腿② infections/illnesses 族攻击 8/8 翻转不判', () => {
  for (const s of ATTACK_L2) flip(hitI(s, { CASE_SURGE_EN5: [] }) === false, '删 CASE_SURGE_EN5 后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_EN=0 → 两新族攻击 19/19 全部翻转不判（窗承重）', () => {
  for (const s of [...ATTACK_L3, ...ATTACK_L2]) flip(hitI(s, { WIN_LEAD_EN: 0 }) === false, '清零 EN 窗后仍命中: ' + s);
});
check('E 族隔离硬探针（反向）：INCIDENCE_CLAIM_EN=[] → r346 现在时腿③独担句 7/7 仍翻转不判（新族不得 rescue）', () => {
  const r346en = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'The screening program surfaced hundreds of cases that would never have progressed, and the case count surge proves the disease is spreading.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'Population-wide early detection has doubled the number of reported cases in five years, suggesting the illness is becoming more prevalent.',
    'Screening detected far more tumors this decade, and more people are being diagnosed with the disease every year.',
  ];
  for (const s of r346en) flip(hitI(s, { INCIDENCE_CLAIM_EN: [] }) === false, '删 INCIDENCE_CLAIM_EN 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：INCIDENCE_CLAIM_EN2=[] → r348 trending 腿③独担句 4/4 仍翻转不判', () => {
  const r348en2 = [
    'Broader screening coverage means the case count is trending upward, indicating the disease is becoming more widespread.',
    'With improved surveillance, diagnosed cases keep rising and the incidence is trending higher.',
    'Screening expanded rapidly, far more cases are now found, and the disease is clearly trending upward.',
    'As CT scanning became universal, the number of diagnosed cases has surged and the cancer looks to be trending higher.',
  ];
  for (const s of r348en2) flip(hitI(s, { INCIDENCE_CLAIM_EN2: [] }) === false, '删 INCIDENCE_CLAIM_EN2 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN=[] → r346 腿② legacy 独担句 7/7 仍翻转不判', () => {
  const r346en = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'The screening program surfaced hundreds of cases that would never have progressed, and the case count surge proves the disease is spreading.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'Population-wide early detection has doubled the number of reported cases in five years, suggesting the illness is becoming more prevalent.',
    'Screening detected far more tumors this decade, and more people are being diagnosed with the disease every year.',
  ];
  for (const s of r346en) flip(hitI(s, { CASE_SURGE_EN: [] }) === false, '删 CASE_SURGE_EN 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN3=[] → r349 被动深形独担句 5/5 仍翻转不判（含 infections got picked up）', () => {
  const r349en3 = [
    'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
    'The rollout of population screening meant that numerous previously undiagnosed cases were brought to light, proving the illness is genuinely becoming more widespread.',
    'Thanks to better surveillance, far more infections got picked up, indicating the disease is truly on the rise.',
    'With improved surveillance, many previously unnoticed cases were identified, and the disease is clearly on the rise.',
    'Broader screening means far more silent infections were detected, indicating the disease is truly becoming more common.',
  ];
  for (const s of r349en3) flip(hitI(s, { CASE_SURGE_EN3: [] }) === false, '删 CASE_SURGE_EN3 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN4=[] → r351 双助动词独担句 7/7 仍翻转不判（单助动词族不得 rescue）', () => {
  const r351en4 = [
    'With the growing use of MRI, far more lesions are being detected, suggesting the disease is really spreading.',
    'Ubiquitous testing means many more infections are being caught, which suggests the disease is truly becoming more widespread.',
    'With wider screening uptake, many more tumors are being picked up, suggesting the cancer is really becoming more common.',
    'As CT scanning became universal, numerous additional cases are being identified, indicating the illness is genuinely on the rise.',
    'After the screening program expanded, far more cases were being diagnosed each year, which shows the disease is truly spreading.',
    'Once mass testing began, many more infections were being identified, suggesting the illness is really becoming more common.',
    'Thanks to ubiquitous testing, a growing number of cases is being detected, which suggests the disease is really on the rise.',
  ];
  for (const s of r351en4) flip(hitI(s, { CASE_SURGE_EN4: [] }) === false, '删 CASE_SURGE_EN4 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN2=[] → r348 are-now-found 承重句 2/2 仍翻转不判', () => {
  const r348en2 = [
    'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
    'Increased uptake of screening has brought many more cases to light — the incidence is truly climbing.',
  ];
  for (const s of r348en2) flip(hitI(s, { CASE_SURGE_EN2: [] }) === false, '删 CASE_SURGE_EN2 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_EN=[] → r347 检出能力变动句 5/5 仍翻转不判', () => {
  const detEn = [
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
    'New imaging technology detects far more tumors, and the incidence appears to be climbing.',
    'Detection rates have risen, the number of diagnosed cases has surged, and the cancer is clearly on the rise.',
  ];
  for (const s of detEn) flip(hitI(s, { DETECT_UP_EN: [] }) === false, '删 DETECT_UP_EN 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：LEAD_SCREEN_ZH=[] → r346 路径 h ZH 5/5 仍翻转不判', () => {
  const r346zh = [
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    '普筛出大量本来一辈子都不会发病的病变，病例数因此激增，可见这种病真的在蔓延。',
    '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
    '推行筛查之后，查出的病例比以前多了好几倍，可见这种疾病确实越来越多。',
    '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
  ];
  for (const s of r346zh) flip(hitI(s, { LEAD_SCREEN_ZH: [] }) === false, '删 LEAD_SCREEN_ZH 后被新族承重不翻转: ' + s);
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hitI('Ubiquitous testing means many more infections have been identified — is the disease really becoming more widespread?'), false, '疑问形未豁免');
});
check('F 边界锁：缺检出腿不判（腿②+腿③齐全，无普及/检出域词）', () => {
  assert.strictEqual(hitI('Many more cases are being identified across the region this year, which showed the disease was truly spreading.'), false, '缺腿①仍判');
});
check('F 边界锁：缺病例激增腿不判（腿①+腿③齐全）', () => {
  assert.strictEqual(hitI('Thanks to ubiquitous testing, the data showed the disease was truly spreading.'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（腿①+腿②齐全）', () => {
  assert.strictEqual(hitI('Thanks to ubiquitous testing, many more infections have been identified this year.'), false, '缺腿③仍判');
});
check('F 边界锁：单助动词形非 EN4 族（EN4 置空不影响腿②新族承重）', () => {
  const s = 'Thanks to ubiquitous testing, many more infections have been identified, which suggests the disease is really becoming more widespread.';
  assert.strictEqual(hitI(s), true, '腿②新族形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN4: [] }), true, 'EN4 置空影响了腿②新族形');
});
check('F 边界锁：双助动词形非腿②新族（EN5 置空不影响 EN4 承重）', () => {
  const s = 'Ubiquitous testing means many more infections are being caught, which suggests the disease is truly becoming more widespread.';
  assert.strictEqual(hitI(s), true, '双助动词形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN5: [] }), true, 'EN5 置空影响了双助动词形');
});
check('F 边界锁：现在时推断词/was 混合形非 EN3 族（legacy p3 gap 吸收承重，EN3 置空不影响）', () => {
  // "which shows the disease was truly spreading"——现在时动词 + was 系词，
  // legacy p3 的 (?:is\s+)? 可选组 + gap 回溯吸收，非本族承重
  const s = 'After the screening program expanded, far more cases were being diagnosed each year, which shows the disease was truly spreading.';
  assert.strictEqual(hitI(s), true, 'legacy p3 形应命中');
  assert.strictEqual(hitI(s, { INCIDENCE_CLAIM_EN3: [] }), true, 'EN3 置空影响了 legacy p3 形');
});
check('F 边界锁：过去时推断词形非 legacy 族（legacy 置空后仍由 EN3 承重）', () => {
  const s = 'After the screening program expanded, far more cases were being diagnosed each year, which showed the disease was truly spreading.';
  assert.strictEqual(hitI(s, { INCIDENCE_CLAIM_EN: [] }), true, 'legacy 置空后过去时形应仍命中（EN3 承重）');
});
check('F 边界锁：跨腿邻近窗（三腿相隔 >400 字符不判）', () => {
  const filler = 'This paragraph is an unrelated community-event planning note covering venue booking, table and chair counts, sound-system debugging, volunteer scheduling, weather and transit reminders, a two-week preparation window, budget and supply lists in an attached spreadsheet, meeting notices already sent by email, and any last-minute changes will be synced in the group chat. Thanks to everyone for cooperating, and we look forward to a successful event with good attendance and smooth on-site execution throughout the day.';
  const s = 'Ubiquitous testing means ' + filler + ' many more infections have been identified, which suggests the disease is really becoming more widespread.';
  assert.ok(s.length - s.indexOf('Ubiquitous testing') > 400, '样本跨度未超窗（样本构造失败）');
  assert.strictEqual(hitI(s), false, '跨腿窗失效');
});
check('F 边界锁：良性工程产能句不判（无病例激增与发生率结论腿）', () => {
  assert.strictEqual(hitI('The radiology department reports that more images are being processed per day after the system upgrade.'), false, '良性工程句被误判');
});

// ─── G. 登记纪律 ──────────────────────────────────────────────────
check('G VERSION / package.json 一致', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.ok(/^\d+\.\d+\.\d+$/.test(v), 'VERSION 格式非法: ' + v);
  assert.strictEqual(pkg.version, v);
});
check('G index.js 既有接线在位（require + 计算点 + dimMap 键）', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/checkImmortalTimeBias/.test(src), 'index.js 缺 checkImmortalTimeBias 接线');
  assert.ok(/immortal_time_bias/.test(src), 'index.js 缺 immortal_time_bias 维度键');
});
check('G __internals 暴露两新族常量且元素数符合登记（EN3 恰 3 形 / EN5 恰 5 形）', () => {
  const I = immortalInternals();
  assert.ok(Array.isArray(I.INCIDENCE_CLAIM_EN3) && I.INCIDENCE_CLAIM_EN3.length === 3, 'INCIDENCE_CLAIM_EN3 应为 3 形');
  assert.ok(Array.isArray(I.CASE_SURGE_EN5) && I.CASE_SURGE_EN5.length === 5, 'CASE_SURGE_EN5 应为 5 形');
});

console.log(`\n负例注入汇总: ${flipCount}/${flipTotal} 个翻转断言全部翻转`);
console.log(`round-352 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
