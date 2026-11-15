'use strict';
/**
 * test/round-350-pathh-leg1-noun-detection.test.js
 * [r350] 路径 (h) 第四措辞家族·腿①检出名词化/普及动作形（真升级类型②：
 * 已有维度的全新措辞家族，维度计数 256 不变、src/index.js 零改动、
 * VERSION 6.8.185 不 bump，同 r339–r349 先例：族内补形不 bump）。
 *
 * r350 立项探针（coordination/agent4/probes/r350-probe-candidates.js，
 * 集成树 v6.8.185 gate() 全量 findings 口径）候选定拨：
 *   候选 A 腿①检出名词化族：攻击 17 条穿透 10 条（7 EN + 3 ZH 为腿①纯形
 *     缺口——findings 无任何维度归因；其余 7 条被 fallacy_of_relevance /
 *     dose_response_linearity / pseudo_causal / reverse_causation 代拦，
 *     不截胡纪律）、良性 10 条中 2 条非 pass 均为既有基线误伤
 *     （post_hoc / activity_outcome_confusion，非本路径新增）→ 落地；
 *   候选 B Berkson 住院选择形（collider_bias COND_EN 名词表缺
 *     hospitalized/inpatient）4/7 穿透、良性 1/4 为既有基线误伤 → 穿
 *     透率低于 A 且需改共享常量 COND_EN，本轮不立项（留交接）；
 *   候选 C 诉诸传统 EN 新形 0/3 已被 fallacy_of_relevance 全覆盖、mean
 *     reversion 金融形 1/4 → 不立项。
 * 海外扫描：arXiv 命中以无关文献为主（HPC/光子/等离子体物理）、GitHub
 * total_count 0 空返、Semantic Scholar 429 限流空返——按既有形态自建，
 * 未编造命中。
 *
 * 补丁（src/immortal-time-bias.js，既有路径与常量零改动，只追加 + 主块
 * 接线第四族腿①）：
 *   · 新增 DETECT_UP_EN4（腿①第四族 6 形：widespread adoption / growing
 *     use of CT/MRI/imaging/scanning/testing、CT scanning became
 *     universal、CT now standard practice、ubiquitous/widespread/mass
 *     testing、mass testing campaigns、expansion of testing capacity）
 *   · 新增 DETECT_UP_ZH4（腿①第四族 3 形：排查/监测/检测+力度加大·
 *     加强、全面/大规模+排查监测、大排查/全员检测）
 *   · 路径 (h) 主块腿①五族取最早匹配；__internals 登记 2 个新常量
 *   · 族独立常量（*4 后缀）而非追加既有家族表：r346–r349 四轮测以精确
 *     equality/注入钉死既有常量元素数与承重（DETECT_UP_EN 恰 5、
 *     DETECT_UP_ZH 恰 2、LEAD_SCREEN_EN 恰 5），追加会打破存量断言——
 *     独立族零触碰存量测试（r338/r348/r349 先例），注入按族隔离。
 *
 * 实现教训（本轮三处攻击句腿②缺口，按 r349 纪律换措辞绕行不扩既有常量）：
 * ① 「far more lesions are being detected」双助动词被动（are being +
 *     detected）不在 CASE_SURGE_EN p9 单助动词可选组内（are / being /
 *     have been / has been / got / getting），探针抓出后换措辞；
 * ② 「many more infections have been identified」的 infections 名词不在
 *     腿②各族名词表（cases / patients / tumors / cancers / lesions）——
 *     换 cases；③ 换措辞版「far more lesions are detected」落入
 *     DETECT_UP_EN p5（r347 more+病例+助动词+检出动词族）的腿①网——
 *     该句改为双承载（新族 + p5 代承腿①），注入-删条探针抓出后最终改用
 *     "the number of diagnosed cases has surged" 腿②形保独担。三项列入交接。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方语料全量）
 *   / D 存量回归（r346+r347+r348+r349 + 路径 a-g + 常量元素数）/ E 常量级
 *   注入-删条承重（逐族 + 窗 + 族隔离双向）/ F 边界锁 / G 登记纪律。
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

// ─── 攻击集（EN 名词化 8 + ZH 排查监测 3，全部立项探针 PEN 纯形）───────
const A_EN = [
  'The widespread adoption of CT scans has identified many more tumors, which shows the cancer is truly becoming more prevalent.',
  'With the growing use of MRI, the number of diagnosed cases has surged, suggesting the disease is really spreading.',
  'As CT scanning became universal, numerous additional cases were picked up, indicating the illness is genuinely on the rise.',
  'With CT now standard practice, the number of diagnosed cases has tripled, suggesting the cancer is really becoming more common.',
  'Thanks to ubiquitous testing, the number of reported cases has tripled, which suggests the disease is really becoming more widespread.',
  'Widespread testing has surfaced many more cases, indicating the disease is really on the rise.',
  'Mass testing campaigns have detected many more cases, which suggests the disease is truly spreading.',
  'The expansion of testing capacity has surfaced numerous additional cases, suggesting the disease is genuinely becoming more widespread.',
];
const A_ZH = [
  '排查力度的加强让更多病例被发现，可见疾病真的在蔓延。',
  '监测力度的加大让更多病例浮出水面，说明患病率真的在上升。',
  '全面排查让大量既往漏掉的病例被重新发现，足以证明这种病真的在变多。',
];
const ATTACK = [...A_EN, ...A_ZH];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：路径 h 第四族攻击 11/11 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：第四族 EN 8/8 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of A_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});
check('B 模块直调：第四族 ZH 3/3 命中且 detail 带过度诊断发生率误读标', () => {
  for (const s of A_ZH) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('过度诊断发生率误读'), 'detail 缺标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // EN 良性孪生（新腿①承重 + 旧豁免族兜底：true/underlying/real incidence stable）
  'The widespread adoption of CT scans has identified many more tumors, but the true incidence may be unchanged.',
  'With the growing use of MRI, the number of diagnosed cases has surged, yet the underlying rate appears stable.',
  'Thanks to ubiquitous testing, the number of reported cases has tripled, though the real incidence seems stable once ascertainment is accounted for.',
  'Mass testing campaigns have detected many more cases, but the actual prevalence does not appear to be rising.',
  // ZH 良性孪生（新腿①承重 + 旧豁免族兜底：检出解释/否定后置/谨慎解读）
  '排查力度的加强让更多病例被发现，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '监测力度的加大让更多病例浮出水面，然而真实患病率似乎并没有变化。',
  '全面排查让大量既往漏掉的病例被重新发现，但这反映的是检出提前，不代表发病率真的上升。',
  // 良性工程/公共卫生陈述（无发生率结论腿）
  'The hospital expanded CT scanning capacity last year to reduce emergency wait times.',
  '随着排查力度加大，社区漏诊率明显下降，公共卫生部门认为这是早期发现策略的成功。',
];
check('C 良性零误伤：路径 h 第四族手工良性 9/9 模块级不判', () => {
  for (const s of BENIGN) assert.strictEqual(hitI(s), false, '误判: ' + s);
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

// ─── D. 存量回归 ──────────────────────────────────────────────────
check('D 存量回归：r346 路径 h 攻击 ZH 8 + EN 7 仍命中且 detail 标不变', () => {
  const R346_ZH = [
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    '普筛出大量本来一辈子都不会发病的病变，病例数因此激增，可见这种病真的在蔓延。',
    '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
    '早筛查出一批终生不会恶变的肿瘤，新增病例大幅增加，说明患这种癌的人越来越多了。',
    '自从开展全员癌症早筛以来，确诊人数一年内翻了好几倍，看来这种病的发病率真的在快速上升。',
    '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
    '推行筛查之后，查出的病例比以前多了好几倍，可见这种疾病确实越来越多。',
    '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
  ];
  const R346_EN = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'The screening program surfaced hundreds of cases that would never have progressed, and the case count surge proves the disease is spreading.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'Population-wide early detection has doubled the number of reported cases in five years, suggesting the illness is becoming more prevalent.',
    'Screening detected far more tumors this decade, and more people are being diagnosed with the disease every year.',
  ];
  for (const s of R346_ZH) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, 'r346 ZH 回归失效: ' + s);
    assert.ok(r.detail.includes('过度诊断发生率误读'), 'detail 缺标: ' + s);
  }
  for (const s of R346_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, 'r346 EN 回归失效: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + s);
  }
});
check('D 存量回归：r347 路径 h 攻击 EN 9 仍命中且 detail 标不变', () => {
  const DET_EN = [
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
    'New imaging technology detects far more tumors, and the incidence appears to be climbing.',
    'Detection rates have risen, the number of diagnosed cases has surged, and the cancer is clearly on the rise.',
  ];
  const HED_EN = [
    'Diagnosed cases tripled after the screening program, and the disease seems to be becoming more common.',
    'Screening surfaced far more tumors, and the incidence looks to be rising.',
    'With so many more cases detected, the disease appears to be spreading.',
    'Since screening expanded, far more cases have been detected, and the incidence appears to be climbing.',
  ];
  for (const s of [...DET_EN, ...HED_EN]) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, 'r347 回归失效: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + s);
  }
});
check('D 存量回归：r348 路径 h 攻击 A 族 7 + B 族 7 仍命中', () => {
  const R348 = [
    'The wider adoption of CT screening has brought more cases to light, and the incidence is clearly rising.',
    'As screening programs expanded, many more cases came to light, proving the disease really is spreading.',
    'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
    'Increased uptake of screening has brought many more cases to light — the incidence is truly climbing.',
    'As screening became more widespread, many more tumors were caught, and the disease appears to be spreading.',
    '筛查项目的铺开让大量潜伏病例浮出水面，可见这种疾病真的在蔓延。',
    '检查的普及使更多病例被及时发现，新发病例激增，足以证明患病率真的升高了。',
    'Diagnosed cases have surged since screening began, so the incidence is trending upward.',
    'Case counts jumped after the screening program, suggesting the illness is on an upward trend.',
    'Screening surfaced far more cancers, and the incidence seems to be trending up sharply.',
    'With so many more cases detected, the disease is clearly trending more common.',
    '筛查普及后确诊人数激增，发病率不断攀升。',
    '体检普及之后确诊病例激增，患病率持续飙升。',
    '普筛上线后新发病例翻倍，这种病呈现出上升趋势。',
  ];
  for (const s of R348) assert.strictEqual(hitI(s), true, 'r348 回归失效: ' + s);
});
check('D 存量回归：r349 路径 h 攻击 EN 9 + ZH 4 仍命中', () => {
  const R349_EN = [
    'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
    'The rollout of population screening meant that numerous previously undiagnosed cases were brought to light, proving the illness is genuinely becoming more widespread.',
    'Thanks to better surveillance, far more infections got picked up, indicating the disease is truly on the rise.',
    'More sensitive imaging means additional cases were picked up, and the incidence appears to be rising.',
    'Enhanced detection got many more cases picked up, suggesting the disease is really spreading.',
    'Improved surveillance has surfaced numerous additional cases, suggesting the illness is becoming more common.',
    'With improved surveillance, many previously unnoticed cases were identified, and the disease is clearly on the rise.',
    'Population screening brought numerous hidden infections to light, proving the illness is genuinely on the rise.',
    'Broader screening means far more silent infections were detected, indicating the disease is truly becoming more common.',
  ];
  const R349_ZH = [
    '普筛铺开让许多既往漏掉的病例被重新发现，足以证明疾病真的在蔓延。',
    '随着检测推广，越来越多隐藏的病例被识别出来，表明这种病真的在蔓延。',
    '筛查推广后大量隐藏病例被带进视野，可见患病率真的在上升。',
    '体检普及之后，大量从未确诊的病例被重新发现，可见这种病的发病率真的在上升。',
  ];
  for (const s of [...R349_EN, ...R349_ZH]) assert.strictEqual(hitI(s), true, 'r349 回归失效: ' + s);
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
  assert.strictEqual(I.LEAD_SCREEN_ZH.length, 2, 'LEAD_SCREEN_ZH 不应被改');
  assert.strictEqual(I.LEAD_SCREEN_EN.length, 5, 'LEAD_SCREEN_EN 不应被改');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
let flipCount = 0, flipTotal = 0;
const flip = (cond, msg) => { flipTotal++; if (cond) flipCount++; else throw new Error(msg); };
check('E 注入 DETECT_UP_EN4=[] → 第四族 EN 独担攻击 8/8 翻转不判', () => {
  for (const s of A_EN) flip(hitI(s, { DETECT_UP_EN4: [] }) === false, '删 DETECT_UP_EN4 后仍命中: ' + s);
});
check('E 注入 DETECT_UP_ZH4=[] → 第四族 ZH 独担攻击 3/3 翻转不判', () => {
  for (const s of A_ZH) flip(hitI(s, { DETECT_UP_ZH4: [] }) === false, '删 DETECT_UP_ZH4 后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_EN=0 / WIN_LEAD_ZH=0 → 新族攻击 EN 8 + ZH 3 全部翻转不判（窗承重）', () => {
  for (const s of A_EN) flip(hitI(s, { WIN_LEAD_EN: 0 }) === false, '清零 EN 窗后仍命中: ' + s);
  for (const s of A_ZH) flip(hitI(s, { WIN_LEAD_ZH: 0 }) === false, '清零 ZH 窗后仍命中: ' + s);
});
check('E 族独立性：DETECT_UP_EN4=[] → r346–r349 存量 EN 26 仍命中', () => {
  const stock = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'The screening program surfaced hundreds of cases that would never have progressed, and the case count surge proves the disease is spreading.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'Population-wide early detection has doubled the number of reported cases in five years, suggesting the illness is becoming more prevalent.',
    'Screening detected far more tumors this decade, and more people are being diagnosed with the disease every year.',
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
    'New imaging technology detects far more tumors, and the incidence appears to be climbing.',
    'Detection rates have risen, the number of diagnosed cases has surged, and the cancer is clearly on the rise.',
    'Diagnosed cases tripled after the screening program, and the disease seems to be becoming more common.',
    'Screening surfaced far more tumors, and the incidence looks to be rising.',
    'With so many more cases detected, the disease appears to be spreading.',
    'Since screening expanded, far more cases have been detected, and the incidence appears to be climbing.',
    'The wider adoption of CT screening has brought more cases to light, and the incidence is clearly rising.',
    'As screening programs expanded, many more cases came to light, proving the disease really is spreading.',
    'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
    'Increased uptake of screening has brought many more cases to light — the incidence is truly climbing.',
    'As screening became more widespread, many more tumors were caught, and the disease appears to be spreading.',
    'Diagnosed cases have surged since screening began, so the incidence is trending upward.',
    'Case counts jumped after the screening program, suggesting the illness is on an upward trend.',
    'Screening surfaced far more cancers, and the incidence seems to be trending up sharply.',
    'With so many more cases detected, the disease is clearly trending more common.',
    'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
  ];
  for (const s of stock) flip(hitI(s, { DETECT_UP_EN4: [] }) === true, '被 DETECT_UP_EN4 置空误伤: ' + s);
});
check('E 族独立性：DETECT_UP_ZH4=[] → r346/r348/r349 存量 ZH 16 仍命中', () => {
  const stock = [
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    '普筛出大量本来一辈子都不会发病的病变，病例数因此激增，可见这种病真的在蔓延。',
    '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
    '早筛查出一批终生不会恶变的肿瘤，新增病例大幅增加，说明患这种癌的人越来越多了。',
    '自从开展全员癌症早筛以来，确诊人数一年内翻了好几倍，看来这种病的发病率真的在快速上升。',
    '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
    '推行筛查之后，查出的病例比以前多了好几倍，可见这种疾病确实越来越多。',
    '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
    '筛查普及后确诊人数激增，发病率不断攀升。',
    '体检普及之后确诊病例激增，患病率持续飙升。',
    '普筛上线后新发病例翻倍，这种病呈现出上升趋势。',
    '筛查项目的铺开让大量潜伏病例浮出水面，可见这种疾病真的在蔓延。',
    '检查的普及使更多病例被及时发现，新发病例激增，足以证明患病率真的升高了。',
    '普筛铺开让许多既往漏掉的病例被重新发现，足以证明疾病真的在蔓延。',
    '随着检测推广，越来越多隐藏的病例被识别出来，表明这种病真的在蔓延。',
    '筛查推广后大量隐藏病例被带进视野，可见患病率真的在上升。',
  ];
  for (const s of stock) flip(hitI(s, { DETECT_UP_ZH4: [] }) === true, '被 DETECT_UP_ZH4 置空误伤: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_EN=[] → r347 检出能力变动句 5/5 仍翻转不判（新族不得 rescue）', () => {
  const DET_EN = [
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
    'New imaging technology detects far more tumors, and the incidence appears to be climbing.',
    'Detection rates have risen, the number of diagnosed cases has surged, and the cancer is clearly on the rise.',
  ];
  for (const s of DET_EN) flip(hitI(s, { DETECT_UP_EN: [] }) === false, '删 DETECT_UP_EN 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_ZH=[] → r348 检查普及承重句 1/1 仍翻转不判', () => {
  flip(hitI('检查的普及使更多病例被及时发现，新发病例激增，足以证明患病率真的升高了。', { DETECT_UP_ZH: [] }) === false, '删 DETECT_UP_ZH 后被新族承重不翻转');
});
check('E 族隔离硬探针（反向）：LEAD_SCREEN_ZH=[] → r346 路径 h ZH 8/8 仍翻转不判', () => {
  const R346_ZH = [
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    '普筛出大量本来一辈子都不会发病的病变，病例数因此激增，可见这种病真的在蔓延。',
    '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
    '早筛查出一批终生不会恶变的肿瘤，新增病例大幅增加，说明患这种癌的人越来越多了。',
    '自从开展全员癌症早筛以来，确诊人数一年内翻了好几倍，看来这种病的发病率真的在快速上升。',
    '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
    '推行筛查之后，查出的病例比以前多了好几倍，可见这种疾病确实越来越多。',
    '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
  ];
  for (const s of R346_ZH) flip(hitI(s, { LEAD_SCREEN_ZH: [] }) === false, '删 LEAD_SCREEN_ZH 后被新族承重不翻转: ' + s);
});
check('E 族独立性：两个新常量全置空 → 存量 r346+r347+r348+r349 攻击 54 仍命中', () => {
  const empty = { DETECT_UP_EN4: [], DETECT_UP_ZH4: [] };
  const stock = [
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    '普筛出大量本来一辈子都不会发病的病变，病例数因此激增，可见这种病真的在蔓延。',
    '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
    '早筛查出一批终生不会恶变的肿瘤，新增病例大幅增加，说明患这种癌的人越来越多了。',
    '自从开展全员癌症早筛以来，确诊人数一年内翻了好几倍，看来这种病的发病率真的在快速上升。',
    '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
    '推行筛查之后，查出的病例比以前多了好几倍，可见这种疾病确实越来越多。',
    '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
    '筛查普及后确诊人数激增，发病率不断攀升。',
    '体检普及之后确诊病例激增，患病率持续飙升。',
    '普筛上线后新发病例翻倍，这种病呈现出上升趋势。',
    '筛查项目的铺开让大量潜伏病例浮出水面，可见这种疾病真的在蔓延。',
    '检查的普及使更多病例被及时发现，新发病例激增，足以证明患病率真的升高了。',
    '普筛铺开让许多既往漏掉的病例被重新发现，足以证明疾病真的在蔓延。',
    '随着检测推广，越来越多隐藏的病例被识别出来，表明这种病真的在蔓延。',
    '筛查推广后大量隐藏病例被带进视野，可见患病率真的在上升。',
    '体检普及之后，大量从未确诊的病例被重新发现，可见这种病的发病率真的在上升。',
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'The screening program surfaced hundreds of cases that would never have progressed, and the case count surge proves the disease is spreading.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'Population-wide early detection has doubled the number of reported cases in five years, suggesting the illness is becoming more prevalent.',
    'Screening detected far more tumors this decade, and more people are being diagnosed with the disease every year.',
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
    'New imaging technology detects far more tumors, and the incidence appears to be climbing.',
    'Detection rates have risen, the number of diagnosed cases has surged, and the cancer is clearly on the rise.',
    'Diagnosed cases tripled after the screening program, and the disease seems to be becoming more common.',
    'Screening surfaced far more tumors, and the incidence looks to be rising.',
    'With so many more cases detected, the disease appears to be spreading.',
    'Since screening expanded, far more cases have been detected, and the incidence appears to be climbing.',
    'The wider adoption of CT screening has brought more cases to light, and the incidence is clearly rising.',
    'As screening programs expanded, many more cases came to light, proving the disease really is spreading.',
    'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
    'Increased uptake of screening has brought many more cases to light — the incidence is truly climbing.',
    'As screening became more widespread, many more tumors were caught, and the disease appears to be spreading.',
    'Diagnosed cases have surged since screening began, so the incidence is trending upward.',
    'Case counts jumped after the screening program, suggesting the illness is on an upward trend.',
    'Screening surfaced far more cancers, and the incidence seems to be trending up sharply.',
    'With so many more cases detected, the disease is clearly trending more common.',
    'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
    'The rollout of population screening meant that numerous previously undiagnosed cases were brought to light, proving the illness is genuinely becoming more widespread.',
    'Thanks to better surveillance, far more infections got picked up, indicating the disease is truly on the rise.',
    'More sensitive imaging means additional cases were picked up, and the incidence appears to be rising.',
    'Enhanced detection got many more cases picked up, suggesting the disease is really spreading.',
    'Improved surveillance has surfaced numerous additional cases, suggesting the illness is becoming more common.',
    'With improved surveillance, many previously unnoticed cases were identified, and the disease is clearly on the rise.',
    'Population screening brought numerous hidden infections to light, proving the illness is genuinely on the rise.',
    'Broader screening means far more silent infections were detected, indicating the disease is truly becoming more common.',
  ];
  for (const s of stock) flip(hitI(s, empty) === true, '被新族置空误伤: ' + s);
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hitI('Widespread testing has surfaced many more cases — is the disease really on the rise?'), false, '疑问形未豁免');
});
check('F 边界锁：缺检出腿不判（名词化检出 + 病例激增 + 发生率结论，无普及/排查域词）', () => {
  assert.strictEqual(hitI('Many more cases were identified across the region this year, suggesting the disease is really becoming more common.'), false, '缺腿①仍判');
});
check('F 边界锁：缺病例激增腿不判（普及检出 + 发生率结论）', () => {
  assert.strictEqual(hitI('Thanks to ubiquitous testing, the disease appears to be really on the rise.'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（普及检出 + 病例激增）', () => {
  assert.strictEqual(hitI('Thanks to ubiquitous testing, many more cases have been identified this year.'), false, '缺腿③仍判');
});
check('F 边界锁：跨腿邻近窗（三腿相隔 >400 字符不判）', () => {
  const filler = 'This paragraph is an unrelated community-event planning note covering venue booking, table and chair counts, sound-system debugging, volunteer scheduling, weather and transit reminders, a two-week preparation window, budget and supply lists in an attached spreadsheet, meeting notices already sent by email, and any last-minute changes will be synced in the group chat. Thanks to everyone for cooperating, and we look forward to a successful event with good attendance and smooth on-site execution throughout the day.';
  const s = 'The widespread adoption of CT scans ' + filler + ' has identified many more tumors, which shows the cancer is truly becoming more prevalent.';
  assert.ok(s.length - s.indexOf('The widespread adoption') > 400, '样本跨度未超窗（样本构造失败）');
  assert.strictEqual(hitI(s), false, '跨腿窗失效');
});
check('F 边界锁：良性工程产能句不判（无病例激增与发生率结论腿）', () => {
  assert.strictEqual(hitI('The hospital expanded CT scanning capacity last year to reduce emergency wait times.'), false, '良性工程句被误判');
});
check('F 边界锁：路径 (f) 过度诊断收益形不被路径 h 截胡', () => {
  const r = checkImmortalTimeBias('早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。');
  assert.ok(r.detail.includes('过度诊断×'), 'detail 应走路径 f: ' + r.detail);
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
check('G __internals 暴露 2 个新族常量且元素数符合登记', () => {
  const I = immortalInternals();
  assert.ok(Array.isArray(I.DETECT_UP_EN4) && I.DETECT_UP_EN4.length === 6, 'DETECT_UP_EN4 应为 6 形');
  assert.ok(Array.isArray(I.DETECT_UP_ZH4) && I.DETECT_UP_ZH4.length === 3, 'DETECT_UP_ZH4 应为 3 形');
});

console.log(`\n负例注入汇总: ${flipCount}/${flipTotal} 个翻转断言全部翻转`);
console.log(`round-350 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
