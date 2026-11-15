'use strict';
/**
 * test/round-353-pathh-leg1-testing-leg2-casenumbers.test.js
 * [r353] 路径 (h) 两个新措辞家族（真升级类型②：已有维度的全新措辞家族，
 * 维度计数 256 不变、src/index.js 零改动、VERSION 6.8.185 不 bump，同
 * r339–r352 先例：族内补形不 bump）。
 *
 * r353 立项探针（coordination/agent4/probes/r353-probe-candidates.js，集成
 * 树 v6.8.185 gate() 全量 findings 口径）四候选定拨：
 *   候选 A(EN) 腿①形容词 + testing 名词形：攻击 12 条 10 条穿透（2 条被
 *     fallacy_of_relevance 代拦，不截胡纪律），其中 5 条纯腿①缺口（腿②/
 *     腿③由 r346–r352 既有族承重，模块级 leg 实测 leg1=-）→ 落地（本轮）；
 *     良性 10 条中 2 条非 pass 均为无路径 h 腿句子被既有维度（vagueness /
 *     pseudo_causal）代拦的基线误伤，模块级路径 h FP 0；
 *   候选 A(ZH) 腿① 更灵敏/更精准 + 检测/检查 名词形：攻击 1/5 穿透（其余
 *     4 条被 immortal_time_bias/fallacy_of_relevance/pseudo_causal/
 *     reasoning_coherence 代拦）且唯一穿透句「更先进的检测手段浮出大量潜伏
 *     病例」兼有腿①与腿②（浮出+名词 动词前置形）双缺口 → 不立项（留交接）；
 *   候选 B Berkson 住院选择形（collider_bias COND_EN 缺 hospitalized/
 *     inpatient）8/12 穿透、需改共享常量 COND_EN → 不立项（第四次留交）；
 *   候选 C 腿② case numbers 复数名词形：攻击 6 条 5 条穿透（3 条纯腿②
 *     缺口 + 2 条腿①覆盖扩张动词形缺口）、良性 5/5 零误伤 → 腿②族落地
 *     （本轮），腿①覆盖扩张动词形缺口留交接。
 * 海外扫描：arXiv 查询词被 OR 拆散返回无关条目（video diffusion/NiO 物理
 * 等，parse-fail）、GitHub total_count 0 空返、S2 429 限流——按既有形态
 * 自建，未编造命中。
 *
 * 补丁（src/immortal-time-bias.js，既有路径与常量零改动，只追加 + 主块
 * 接线 + __internals 登记）：
 *   · 新增 DETECT_UP_EN5（腿①第六族 1 形：(more)? sensitive/accurate/
 *     precise/advanced/improved/better/enhanced/newer + testing——DETECT_UP_EN
 *     p3 名词表 tests? 受 \b 尾界限制不匹配 testing 动名词形、p4 须
 *     imaging/scanning/diagnostic + technology/methods 前缀）；
 *   · 新增 CASE_SURGE_EN6（腿②第六族 2 形：p1 检出形容词 + case numbers
 *     + has/have + 激增动词；p2 裸 case numbers + (has/have)? + 激增动词
 *     ——legacy p1/p2/p6 只收 number of + cases 与 cases + has/have + 动词
 *     单数名词形，复数名词 "case numbers" 无形）；
 *   · 路径 (h) 主块腿①六族、腿②六族取最早匹配。
 * 族独立常量（EN5/EN6 后缀）而非追加既有家族表：r346–r352 七轮测以精确
 * equality/注入钉死既有常量元素数与承重（DETECT_UP_EN 恰 5、DETECT_UP_EN4
 * 恰 6、CASE_SURGE_EN 恰 12、CASE_SURGE_EN2 恰 5、CASE_SURGE_EN5 恰 5），
 * 追加会打破存量断言——独立族零触碰存量测试（r338/r348–r352 先例）。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 gate+模块 + 官方
 *   语料全量 + 既有基线句隔离）/ D 存量回归（r346–r352 + 路径 a-g + 常量
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
// 腿① 形容词 + testing 名词族（EN 8：探针 5 纯腿①缺口 + 扩展 3——more
// precise/newer/enhanced 变体；腿②由 CASE_SURGE_EN3/EN4/legacy、腿③由
// legacy INCIDENCE_CLAIM_EN 承重）
const ATTACK_L1 = [
  'With advanced testing, far more cases are being detected, suggesting the cancer is truly spreading.',
  'More accurate testing means many more tumors are being picked up, indicating the disease is really on the rise.',
  'Improved testing has identified numerous additional cases, which suggests the disease is truly becoming more common.',
  'With newer testing methods, many more lesions are being found, which suggests the disease is really spreading.',
  'Better testing identified many more tumors, which suggests the disease is truly on the rise.',
  // 扩展形：形容词变体 × 同族腿②/腿③
  'With more precise testing, many more infections have been caught, suggesting the illness is really becoming more common.',
  'Newer testing detected many more lesions, which suggests the disease is genuinely on the rise.',
  'Enhanced testing means numerous additional tumors are being uncovered, which shows the cancer is truly on the rise.',
];
// 腿② case numbers 复数名词族（EN 5：探针 3 + 扩展 2——new case numbers
// have doubled / identified case numbers jumped 裸助动词形）
const ATTACK_L2 = [
  'After the screening program expanded, diagnosed case numbers climbed steadily, which suggests the disease is really becoming more common.',
  'With wider screening, case numbers have risen sharply, suggesting the cancer is truly on the rise.',
  'Thanks to mass testing, reported case numbers tripled last year, indicating the disease is genuinely spreading.',
  'Since screening expanded, new case numbers have doubled, proving the disease is truly spreading.',
  'With wider screening uptake, identified case numbers jumped, which shows the cancer is really becoming more widespread.',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：腿① testing 名词族攻击 8/8 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L1) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿② case numbers 族攻击 5/5 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：腿①族 EN 8/8 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of ATTACK_L1) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});
check('B 模块直调：腿②族 EN 5/5 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of ATTACK_L2) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // 腿①孪生：形容词 testing + 旧豁免族兜底（true/actual incidence stable / does not appear to be rising）
  'With advanced testing, far more cases are being detected, though the true incidence appears stable once ascertainment is accounted for.',
  'More accurate testing means many more tumors are being picked up, but the actual prevalence does not appear to be rising.',
  // 腿②孪生：case numbers + 旧豁免族兜底
  'After the screening program expanded, diagnosed case numbers climbed steadily, though the true incidence appears stable once ascertainment is accounted for.',
  'With wider screening, case numbers have risen sharply, but the actual prevalence does not appear to be rising.',
  // 良性陈述（无病例激增腿或无发生率结论腿）
  'The lab adopted more sensitive testing, and turnaround times improved markedly.',
  'With newer testing methods, the hospital processed more samples per day.',
  'More precise testing allowed earlier intervention for those already diagnosed.',
  'The clinic switched to advanced testing to comply with the new accreditation standards.',
  'Researchers compared sensitive testing against standard assays in the methods section.',
  '更灵敏的检测让更多病例被检出，实验室周转时间明显缩短。',
  'As screening coverage expanded, the clinic processed more samples per day.',
  'With testing intensity increased, turnaround times improved markedly.',
  '随着筛查覆盖面的扩大，医院每天排查的人数明显增多。',
  // r352 既有良性（防本轮回归）
  'Screening identified many more infections, and the lab validated the results with confirmatory assays.',
  'The radiology department reports that more images are being processed per day after the system upgrade.',
];
check('C 良性零误伤：两新族手工良性 16/16 gate 层 pass 且模块级不判', () => {
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
// 探针中 3 条无路径 h 腿（或腿②仍缺口）的句子被既有维度代拦——立项探针已
// 实证为既有基线（非本轮新增），这里钉死模块级路径 h 不判、gate 层不由
// immortal_time_bias 承重
const BASELINE_FP = [
  'Improved testing reduced the cost per sample by nearly half.',
  '采用更精准的检测后，医院每天处理的样本量大幅上升。',
  'More sensitive testing has uncovered many more cases, and this proves the disease is really spreading.',
];
check('C 既有基线隔离：3 条句子 gate 层非 pass 均由既有维度承重、模块级路径 h 不判', () => {
  for (const s of BASELINE_FP) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '应仍被既有维度代拦: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(!f, '不应由 immortal_time_bias 承重: ' + s);
    assert.strictEqual(hitI(s), false, '模块级误判: ' + s);
  }
});

// ─── D. 存量回归 ──────────────────────────────────────────────────
check('D 存量回归：r346–r352 路径 h 攻击仍命中（注入两新族置空不受影响）', () => {
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
    // r352 腿② infections/illnesses 单助动词 EN5 + 腿③过去时 EN3
    'Thanks to ubiquitous testing, many more infections have been identified, which suggests the disease is really becoming more widespread.',
    'With wider screening, far more illnesses have been detected, indicating the disease is genuinely on the rise.',
    'With wider screening, reported illnesses have tripled, suggesting the disease is really becoming more common.',
    'Screening identified many more infections, which suggests the disease is really on the rise.',
    'After the screening program expanded, far more cases were being diagnosed each year, which showed the disease was truly spreading.',
    'With wider screening, many more cases were brought to light, and it became clear the disease was truly on the rise.',
  ];
  for (const s of stock) {
    assert.strictEqual(hitI(s), true, '存量回归失效: ' + s);
    assert.strictEqual(hitI(s, { DETECT_UP_EN5: [], CASE_SURGE_EN6: [] }), true, '被新族置空误伤: ' + s);
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
  assert.strictEqual(I.CASE_SURGE_EN5.length, 5, 'CASE_SURGE_EN5 应保持 5');
  assert.strictEqual(I.INCIDENCE_CLAIM_EN3.length, 3, 'INCIDENCE_CLAIM_EN3 应保持 3');
  assert.strictEqual(I.LEAD_SCREEN_ZH.length, 2, 'LEAD_SCREEN_ZH 不应被改');
  assert.strictEqual(I.LEAD_SCREEN_EN.length, 5, 'LEAD_SCREEN_EN 不应被改');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
let flipCount = 0, flipTotal = 0;
const flip = (cond, msg) => { flipTotal++; if (cond) flipCount++; else throw new Error(msg); };
check('E 注入 DETECT_UP_EN5=[] → 腿① testing 名词族攻击 8/8 翻转不判', () => {
  for (const s of ATTACK_L1) flip(hitI(s, { DETECT_UP_EN5: [] }) === false, '删 DETECT_UP_EN5 后仍命中: ' + s);
});
check('E 注入 CASE_SURGE_EN6=[] → 腿② case numbers 族攻击 5/5 翻转不判', () => {
  for (const s of ATTACK_L2) flip(hitI(s, { CASE_SURGE_EN6: [] }) === false, '删 CASE_SURGE_EN6 后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_EN=0 → 两新族攻击 13/13 全部翻转不判（窗承重）', () => {
  for (const s of [...ATTACK_L1, ...ATTACK_L2]) flip(hitI(s, { WIN_LEAD_EN: 0 }) === false, '清零 EN 窗后仍命中: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_EN=[] → r347 检出能力变动独担句 5/5 仍翻转不判（testing 族不得 rescue）', () => {
  const detEn = [
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
    'New imaging technology detects far more tumors, and the incidence appears to be climbing.',
    'Detection rates have risen, the number of diagnosed cases has surged, and the cancer is clearly on the rise.',
  ];
  for (const s of detEn) flip(hitI(s, { DETECT_UP_EN: [] }) === false, '删 DETECT_UP_EN 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_EN4=[] → r350 腿①名词化独担句 5/5 仍翻转不判（testing 族不得 rescue）', () => {
  const r350en4 = [
    'The widespread adoption of CT scans has identified many more tumors, which shows the cancer is truly becoming more prevalent.',
    'Mass testing campaigns have detected many more cases, which suggests the disease is truly spreading.',
    'As CT scanning became universal, numerous additional cases are being identified, indicating the illness is genuinely on the rise.',
    'Thanks to ubiquitous testing, a growing number of cases is being detected, which suggests the disease is really on the rise.',
    'The expansion of testing capacity meant far more cases were identified, which suggests the disease is really becoming more widespread.',
  ];
  for (const s of r350en4) flip(hitI(s, { DETECT_UP_EN4: [] }) === false, '删 DETECT_UP_EN4 后被新族承重不翻转: ' + s);
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
check('E 族隔离硬探针（反向）：CASE_SURGE_EN2=[] → r348 case counts/被动浮现独担句 3/3 仍翻转不判（case numbers 族不得 rescue）', () => {
  const r348en2 = [
    'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
    'Increased uptake of screening has brought many more cases to light — the incidence is truly climbing.',
    'As screening became more widespread, case counts jumped, indicating the disease is becoming more prevalent.',
  ];
  for (const s of r348en2) flip(hitI(s, { CASE_SURGE_EN2: [] }) === false, '删 CASE_SURGE_EN2 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN5=[] → r352 infections/illnesses 独担句 4/4 仍翻转不判（case numbers 族不得 rescue）', () => {
  const r352en5 = [
    'Thanks to ubiquitous testing, many more infections have been identified, which suggests the disease is really becoming more widespread.',
    'With wider screening, far more illnesses have been detected, indicating the disease is genuinely on the rise.',
    'With wider screening, reported illnesses have tripled, suggesting the disease is really becoming more common.',
    'Screening identified many more infections, which suggests the disease is really on the rise.',
  ];
  for (const s of r352en5) flip(hitI(s, { CASE_SURGE_EN5: [] }) === false, '删 CASE_SURGE_EN5 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：LEAD_SCREEN_EN=[] → r346 路径 h EN 独担句 5/5 仍翻转不判', () => {
  const r346en = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'Screening detected far more tumors this decade, and more people are being diagnosed with the disease every year.',
  ];
  for (const s of r346en) flip(hitI(s, { LEAD_SCREEN_EN: [] }) === false, '删 LEAD_SCREEN_EN 后被新族承重不翻转: ' + s);
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hitI('With advanced testing, far more cases are being detected — is the cancer truly spreading?'), false, '疑问形未豁免');
});
check('F 边界锁：缺检出腿不判（腿②+腿③齐全，无普及/检出域词）', () => {
  assert.strictEqual(hitI('Many more infections have been caught across the region this year, which suggests the disease is truly becoming more widespread.'), false, '缺腿①仍判');
});
check('F 边界锁：缺病例激增腿不判（腿①+腿③齐全）', () => {
  assert.strictEqual(hitI('With advanced testing, the data suggests the disease is truly becoming more common.'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（腿①+腿②齐全）', () => {
  assert.strictEqual(hitI('With advanced testing, many more tumors are being picked up.'), false, '缺腿③仍判');
});
check('F 边界锁：case numbers 族非 EN5 族（EN5 置空不影响腿① testing 形承重）', () => {
  const s = 'With advanced testing, far more cases are being detected, suggesting the cancer is truly spreading.';
  assert.strictEqual(hitI(s), true, '腿①新族形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN6: [] }), true, 'EN6 置空影响了腿①新族形');
});
check('F 边界锁：testing 族非 EN6 族（EN6 置空不影响腿② case numbers 形承重）', () => {
  const s = 'After the screening program expanded, diagnosed case numbers climbed steadily, which suggests the disease is really becoming more common.';
  assert.strictEqual(hitI(s), true, '腿②新族形应命中');
  assert.strictEqual(hitI(s, { DETECT_UP_EN5: [] }), true, 'EN5 置空影响了腿②新族形');
});
check('F 边界锁：case counts 复数形非 case numbers 族（EN6 置空不影响 EN2 p1 承重）', () => {
  const s = 'As screening became more widespread, case counts jumped, indicating the disease is becoming more prevalent.';
  assert.strictEqual(hitI(s), true, 'case counts 形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN6: [] }), true, 'EN6 置空影响了 case counts 形');
});
check('F 边界锁：number-of 单数形非 case numbers 族（EN6 置空不影响 legacy p1 承重）', () => {
  const s = 'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.';
  assert.strictEqual(hitI(s), true, 'number-of 形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN6: [] }), true, 'EN6 置空影响了 number-of 形');
});
check('F 边界锁：tests 单数名词形非 testing 族（EN5 置空不影响 DETECT_UP_EN p3 承重）', () => {
  // p3 收 sensitive tests（tests? 单复数）——EN5 只收 testing 动名词形，
  // 本句腿①由 p3 承重，置空 EN5 后仍应命中
  const s = 'Thanks to more sensitive tests, far more tumors were caught, which indicated the disease was genuinely becoming more widespread.';
  assert.strictEqual(hitI(s), true, 'sensitive tests 形应命中（p3 承重腿①）');
  assert.strictEqual(hitI(s, { DETECT_UP_EN5: [] }), true, 'EN5 置空影响了 sensitive tests 形');
});
check('F 边界锁：跨腿邻近窗（三腿相隔 >400 字符不判）', () => {
  const filler = 'This paragraph is an unrelated community-event planning note covering venue booking, table and chair counts, sound-system debugging, volunteer scheduling, weather and transit reminders, a two-week preparation window, budget and supply lists in an attached spreadsheet, meeting notices already sent by email, and any last-minute changes will be synced in the group chat. Thanks to everyone for cooperating, and we look forward to a successful event with good attendance and smooth on-site execution throughout the day.';
  const s = 'With advanced testing, ' + filler + ' far more cases are being detected, suggesting the cancer is truly spreading.';
  assert.ok(s.length - s.indexOf('With advanced testing') > 400, '样本跨度未超窗（样本构造失败）');
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
check('G __internals 暴露两新族常量且元素数符合登记（EN5 恰 1 形 / EN6 恰 2 形）', () => {
  const I = immortalInternals();
  assert.ok(Array.isArray(I.DETECT_UP_EN5) && I.DETECT_UP_EN5.length === 1, 'DETECT_UP_EN5 应为 1 形');
  assert.ok(Array.isArray(I.CASE_SURGE_EN6) && I.CASE_SURGE_EN6.length === 2, 'CASE_SURGE_EN6 应为 2 形');
});

console.log(`\n负例注入汇总: ${flipCount}/${flipTotal} 个翻转断言全部翻转`);
console.log(`round-353 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
