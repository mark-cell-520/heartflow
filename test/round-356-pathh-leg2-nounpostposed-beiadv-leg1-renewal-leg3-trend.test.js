'use strict';
/**
 * round-356 轮测：路径 (h) 剩余缺口四族落地验证（r355 交接项①②③ + 探针自建缺口）
 *   · 新增 CASE_SURGE_ZH5（腿②第十一族 1 形，ZH 专项）：病例名词 + [≤6 字 gap] +
 *     浮现/显现/涌现/显露 + [出来|出]（名词后置裸动词形——ZH2 须浮出水面/带入
 *     视野/暴露出来整词、ZH3 须被+发现、ZH4 动词前置、legacy 须激增类方向动词）。
 *   · 新增 CASE_SURGE_ZH6（腿②第十二族 1 形，ZH 专项）：病例名词 + [≤8 字 gap] +
 *     被/得以/得到 + 副词（必填）+ (重新)? + 发现/识别/查出/检出/确诊（ZH3 直缀形
 *     专属，副词必填保族隔离；被及时发现良性侧由 EXEMPT_INC_ZH (c) 兜底）。
 *   · 新增 DETECT_UP_ZH6（腿①第九族 2 形，ZH 专项）：(p1) 检查/检测/检验/诊断 +
 *     技术/手段/方法/能力/水平/工具/设备 + 更新换代/升级换代/迭代/革新/换代/
 *     日新月异/今非昔比；(p2) 动词直缀短形 检测升级/检查更新（DETECT_UP_ZH 须
 *     进步/普及后缀、ZH5 须形容词+技术后缀、ZH4 须力度后缀）。
 *   · 新增 INCIDENCE_CLAIM_ZH3（腿③第四族 1 形，ZH 专项）：发病率/患病率 +
 *     [≤8 字 gap] + 走强/看涨/升温/走热（legacy p1 走高、ZH2 攀升/飙升/上行
 *     已承重故不收，防族隔离破裂）。
 * 主块腿①九族/腿②十二族/腿③四族取最早匹配；族独立常量仿 r338/r348–r355 先例，
 * src/index.js 零改动，维度 256 不变，VERSION 不 bump。
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 gate+模块 + 官方语料
 *   全量 + 既有基线句隔离）/ D 存量回归（r346–r355 + 路径 a-g + 常量元素数）/
 *   E 常量级注入-删条承重（逐族 + 窗 + 族隔离双向硬探针）/ F 边界 lock /
 *   G 登记纪律。
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
// ① 腿②浮现名词后置形（CASE_SURGE_ZH5，5；腿①检查普及、腿③患病率真的在上升）
const ATTACK_L2_SURFACE = [
  '检查普及让大量潜伏病例浮现出来，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例浮现，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例显现出来，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例涌现出来，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例显露出来，这说明患病率真的在上升。',
];
// ② 腿②被+副词+检出动词形（CASE_SURGE_ZH6，7；前 3 条立项探针穿透、后 4 条
// 探针期被 pseudo_causal/reverse_causation 代拦——模块级 leg2 缺口真实）
const ATTACK_L2_BEIADV = [
  '检查普及以来，众多隐匿病灶被陆续发现，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被大量发现，说明患病率真的在上升。',
  '检查普及让更多病例被及时发现，这说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被不断识别，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被陆续确诊，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被大量确诊，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被逐步检出，说明患病率真的在上升。',
];
// ③ 腿①更新换代形（DETECT_UP_ZH6，7；腿②被重新发现 ZH3、腿③患病率真的在上升）
const ATTACK_L1_RENEWAL = [
  '检测手段更新换代让更多病例被重新发现，这说明患病率真的在上升。',
  '检测手段升级换代让更多病例被重新发现，这说明患病率真的在上升。',
  '检测手段日新月异让更多病例被重新发现，这说明患病率真的在上升。',
  '检测能力今非昔比让更多病例被重新发现，这说明患病率真的在上升。',
  '检测升级让更多病例被重新发现，这说明患病率真的在上升。',
  '检查更新让更多病例被重新发现，这说明患病率真的在上升。',
  '检测技术迭代让更多病例被重新发现，这说明患病率真的在上升。',
];
// ④ 腿③发生率侧新趋势动词形（INCIDENCE_CLAIM_ZH3，5；腿①检查普及、腿②被重新发现）
const ATTACK_L3_TREND = [
  '检查普及让更多病例被重新发现，患病率一路走强。',
  '检查普及让更多病例被重新发现，患病率持续看涨。',
  '检查普及让更多病例被重新发现，患病率稳步升温。',
  '检查普及让更多病例被重新发现，患病率一路走热。',
  '检查普及让更多病例被重新发现，表明患病率一路走强。',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：腿②浮现名词后置族攻击 5/5 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2_SURFACE) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿②被+副词族攻击 7/7 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2_BEIADV) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿①更新换代族攻击 7/7 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L1_RENEWAL) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿③趋势动词族攻击 5/5 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L3_TREND) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：四新族攻击 24/24 命中且 detail 带过度诊断发生率误读标', () => {
  for (const s of [...ATTACK_L2_SURFACE, ...ATTACK_L2_BEIADV, ...ATTACK_L1_RENEWAL, ...ATTACK_L3_TREND]) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence') || r.detail.includes('过度诊断发生率误读'), 'detail 缺标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // 浮现族孪生：谨慎解读/无腿③
  '检查普及让大量潜伏病例浮现出来，但这并不代表发病率真的上升。',
  '检查普及让大量潜伏病例浮现出来，实验室已将其纳入随访名单。',
  // 更新换代族孪生：谨慎解读/无腿②/无腿③/名词中介剔除形
  '检测手段更新换代让更多病例被重新发现，但这并不代表发病率真的上升。',
  '检测手段更新换代让早期确诊比例明显提高，是体检中心的常规推荐。',
  '产品检测流程更新后，用户投诉率下降了三成。',
  '系统检测模块更新后，线上报警数量明显下降。',
  '软件检查工具迭代后，代码缺陷率下降了三成。',
  // 趋势动词族孪生：谨慎解读/统计口径未变
  '检查普及让更多病例被重新发现，但患病率可能并没有上升。',
  '检查普及让更多病例被重新发现，患病率统计口径本身没有变化。',
  '检查普及让更多病例被重新发现，患病率可能并没有走强。',
  // 被+副词族孪生：谨慎解读/无腿③
  '检查普及让更多病例被及时发现，这主要是检出提前带来的统计错觉。',
  '检查普及让更多病例被及时发现，但这并不代表发病率真的上升。',
  '检查普及以来，众多隐匿病灶被不断识别，但这并不代表发病率真的上升。',
  '检查普及以来，无症状感染者被陆续确诊并转入随访，流程运转正常。',
];
check('C 良性零误伤：四新族手工良性 15/15 模块级路径 h 不判', () => {
  for (const s of BENIGN) {
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
// 探针中 2 条良性形被既有维度在 gate 层代拦——立项探针已实证为既有基线
// （reverse_causation / pseudo_causal——无腿②/腿③，路径 h 不判，独立承重），
// 这里钉死模块级路径 h 不判、findings 不由 immortal_time_bias 承重
const BASELINE_FP = [
  '检测手段更新换代让早期确诊比例明显提高，是体检中心的常规推荐。',
  '产品检测流程更新后，用户投诉率下降了三成。',
];
check('C 既有基线隔离：2 条工程形 gate 层非 pass 均非 immortal_time_bias 承重、模块级路径 h 不判', () => {
  for (const s of BASELINE_FP) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '应仍被既有维度代拦: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(!f, '不应由 immortal_time_bias 承重（否则为本轮新增误伤）: ' + s);
    assert.strictEqual(hitI(s), false, '模块级路径 h 误判: ' + s);
  }
});

// ─── D. 存量回归 ──────────────────────────────────────────────────
check('D 存量回归：r346–r355 路径 h 攻击仍命中（注入四新族置空不受影响）', () => {
  const stock = [
    // r346 腿② legacy 激增形 + 腿③现在时
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    // r347 腿①检出能力变动 + 腿②旧族
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    // r348 腿②被动浮现 EN2（were caught）+ ZH 腿①普及形
    'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
    'As screening became more widespread, many more tumors were caught, and the disease appears to be spreading.',
    '检查的普及让更多病例被查出，这说明患病率真的在上升。',
    // r349 腿②被动深形 EN3 + ZH 被重新发现
    'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
    'Thanks to sensitive testing, the audit has surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.',
    '筛查推广后，大量隐匿病例被重新发现，表明患病率确实在升高。',
    // r350 腿①名词化（DETECT_UP_EN4）+ 腿② legacy
    'The widespread adoption of CT scans has identified many more tumors, which shows the cancer is truly becoming more prevalent.',
    'The expansion of testing capacity meant far more cases were identified, which suggests the disease is really becoming more widespread.',
    // r351 腿②双助动词 EN4
    'With the growing use of MRI, far more lesions are being detected, suggesting the disease is really spreading.',
    // r352 腿② infections/illnesses 单助动词 EN5 + 腿③过去时 EN3
    'Thanks to ubiquitous testing, many more infections have been identified, which suggests the disease is really becoming more widespread.',
    'Screening identified many more infections, which suggests the disease is really on the rise.',
    // r353 腿① testing 名词 EN5 + 腿② case numbers EN6
    'With advanced testing, far more cases are being detected, suggesting the cancer is truly spreading.',
    'After the screening program expanded, diagnosed case numbers climbed steadily, which suggests the disease is really becoming more common.',
    // r354 EN6/EN7/EN8 新族代表句
    'Once testing coverage expanded, many more silent cases were uncovered, which showed the disease was truly becoming more widespread.',
    'Advanced testing picked up far more tumors than before, suggesting the cancer is truly becoming more common.',
    'Thanks to sensitive testing, the audit surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.',
    // r355 三新族代表句（ZH5 腿①形容词前置 / EN9 / ZH4 动词前置 + 双缺口组合）
    '新型的检验技术上线后，大量无症状感染者被确诊，表明患病率确实在提高。',
    'With sensitive testing, the scan picked up far more early-stage tumors, suggesting the cancer is truly becoming more common.',
    'With sensitive testing, numerous additional cases surfaced, proving the disease is becoming more common.',
    '随着检测普及，浮出大量潜伏病例，这说明这种病真的在变多。',
    '更先进的检测手段浮出大量潜伏病例，这说明这种病真的在变多。',
  ];
  for (const s of stock) {
    assert.strictEqual(hitI(s), true, '存量回归失效: ' + s);
    assert.strictEqual(hitI(s, { CASE_SURGE_ZH5: [], CASE_SURGE_ZH6: [], DETECT_UP_ZH6: [], INCIDENCE_CLAIM_ZH3: [] }), true, '被四新族置空误伤: ' + s);
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
  // r353–r355 既有新族常量元素数不变
  assert.strictEqual(I.DETECT_UP_EN5.length, 1, 'DETECT_UP_EN5 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN6.length, 2, 'CASE_SURGE_EN6 应保持 2');
  assert.strictEqual(I.DETECT_UP_EN6.length, 1, 'DETECT_UP_EN6(EN) 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN7.length, 1, 'CASE_SURGE_EN7 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN8.length, 2, 'CASE_SURGE_EN8 应保持 2');
  assert.strictEqual(I.CASE_SURGE_EN9.length, 2, 'CASE_SURGE_EN9 应保持 2');
  assert.strictEqual(I.DETECT_UP_ZH5.length, 1, 'DETECT_UP_ZH5 应保持 1');
  assert.strictEqual(I.CASE_SURGE_ZH4.length, 1, 'CASE_SURGE_ZH4 应保持 1');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
let flipCount = 0, flipTotal = 0;
const flip = (cond, msg) => { flipTotal++; if (cond) flipCount++; else throw new Error(msg); };
check('E 注入 CASE_SURGE_ZH5=[] → 浮现名词后置族攻击 5/5 翻转不判', () => {
  for (const s of ATTACK_L2_SURFACE) flip(hitI(s, { CASE_SURGE_ZH5: [] }) === false, '删 CASE_SURGE_ZH5 后浮现形仍命中: ' + s);
});
check('E 注入 CASE_SURGE_ZH6=[] → 被+副词族攻击 7/7 翻转不判', () => {
  for (const s of ATTACK_L2_BEIADV) flip(hitI(s, { CASE_SURGE_ZH6: [] }) === false, '删 CASE_SURGE_ZH6 后被+副词形仍命中: ' + s);
});
check('E 注入 DETECT_UP_ZH6=[] → 更新换代族攻击 7/7 翻转不判', () => {
  for (const s of ATTACK_L1_RENEWAL) flip(hitI(s, { DETECT_UP_ZH6: [] }) === false, '删 DETECT_UP_ZH6 后仍命中: ' + s);
});
check('E 注入 INCIDENCE_CLAIM_ZH3=[] → 趋势动词族攻击 5/5 翻转不判', () => {
  for (const s of ATTACK_L3_TREND) flip(hitI(s, { INCIDENCE_CLAIM_ZH3: [] }) === false, '删 INCIDENCE_CLAIM_ZH3 后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_ZH=0 → ZH 四族攻击 24/24 全部翻转不判（窗承重）', () => {
  for (const s of [...ATTACK_L2_SURFACE, ...ATTACK_L2_BEIADV, ...ATTACK_L1_RENEWAL, ...ATTACK_L3_TREND]) flip(hitI(s, { WIN_LEAD_ZH: 0 }) === false, '清零 ZH 窗后仍命中: ' + s);
});
// ─── 族隔离反向硬探针：删旧常量后其独担句必须翻转，四新族不得 rescue ───
check('E 族隔离硬探针（反向）：CASE_SURGE_ZH2=[] → 浮出水面/暴露出来后置独担句 2/2 仍翻转不判（ZH5 浮现动词形不得 rescue 整词后置形）', () => {
  const zh = [
    '检查普及让大量潜伏病例浮出水面，这说明患病率真的在上升。',
    '检查普及让大量潜伏病例暴露出来，这说明患病率真的在上升。',
  ];
  for (const s of zh) flip(hitI(s, { CASE_SURGE_ZH2: [] }) === false, '删 CASE_SURGE_ZH2 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_ZH3=[] → 被+发现直缀独担句 2/2 仍翻转不判（ZH6 副词必填不得 rescue 直缀形）', () => {
  const zh = [
    '检查普及以来，众多隐匿病灶被重新发现，说明患病率真的在上升。',
    '检查普及以来，众多隐匿病灶被识别，说明患病率真的在上升。',
  ];
  for (const s of zh) flip(hitI(s, { CASE_SURGE_ZH3: [] }) === false, '删 CASE_SURGE_ZH3 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_ZH4=[] → 浮出动词前置独担句 2/2 仍翻转不判（ZH5 名词后置形不得 rescue 动词前置形）', () => {
  const zh = [
    '随着检测普及，浮出大量潜伏病例，这说明这种病真的在变多。',
    '筛查推广后，浮现出许多无症状感染者，表明患病率确实在升高。',
  ];
  for (const s of zh) flip(hitI(s, { CASE_SURGE_ZH4: [] }) === false, '删 CASE_SURGE_ZH4 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_ZH=[] → 普及/进步后缀独担句 2/2 仍翻转不判（ZH6 更新换代动词不得 rescue 后缀形）', () => {
  const zh = [
    '检测手段的进步让更多病例被查出，这说明患病率真的在上升。',
    '检查的普及让更多病例被查出，这说明患病率真的在上升。',
  ];
  for (const s of zh) flip(hitI(s, { DETECT_UP_ZH: [] }) === false, '删 DETECT_UP_ZH 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_ZH5=[] → 形容词前置独担句 1/1 仍翻转不判（ZH6 无形容词前置形不得 rescue）', () => {
  const s = '更先进的检测手段让更多病例被查出，这说明患病率真的在上升。';
  flip(hitI(s, { DETECT_UP_ZH5: [] }) === false, '删 DETECT_UP_ZH5 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_ZH4=[] → 力度后缀独担句 1/1 仍翻转不判（ZH6 名词表无排查/监测、动词无力度后缀）', () => {
  const s = '检测力度的加强让更多病例被查出，这说明患病率真的在上升。';
  flip(hitI(s, { DETECT_UP_ZH4: [] }) === false, '删 DETECT_UP_ZH4 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：INCIDENCE_CLAIM_ZH=[] → 上升/走高独担句 2/2 仍翻转不判（ZH3 腿③族不收走高——走高 legacy 专属）', () => {
  const zh = [
    '检查普及让更多病例被重新发现，患病率真的在上升，这种病真的在变多。',
    '检查普及让更多病例被重新发现，患病率节节走高。',
  ];
  for (const s of zh) flip(hitI(s, { INCIDENCE_CLAIM_ZH: [] }) === false, '删 INCIDENCE_CLAIM_ZH 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：INCIDENCE_CLAIM_ZH2=[] → 攀升/飙升独担句 2/2 仍翻转不判（ZH3 腿③族趋势动词表不收攀升类）', () => {
  const zh = [
    '检查普及让更多病例被重新发现，患病率一路攀升。',
    '检查普及让更多病例被重新发现，患病率持续飙升。',
  ];
  for (const s of zh) flip(hitI(s, { INCIDENCE_CLAIM_ZH2: [] }) === false, '删 INCIDENCE_CLAIM_ZH2 后被新族承重不翻转: ' + s);
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hitI('检查普及让大量潜伏病例浮现出来——这说明患病率真的在上升吗？'), false, '疑问形未豁免');
});
check('F 边界锁：缺检出腿不判（腿②+腿③齐全，无普及/检出域词）', () => {
  assert.strictEqual(hitI('大量潜伏病例浮现出来，这说明患病率真的在上升。'), false, '缺腿①仍判');
});
check('F 边界锁：缺病例激增腿不判（腿①+腿③齐全）', () => {
  assert.strictEqual(hitI('检测升级后，检验科通过了iso认证，说明患病率真的在上升。'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（腿①+腿②齐全）', () => {
  assert.strictEqual(hitI('检查普及让大量潜伏病例浮现出来。'), false, '缺腿③仍判');
});
check('F 边界锁：ZH6 副词必填（被+发现直缀形由 ZH3 专属，ZH6 置空不影响）', () => {
  const s = '检查普及以来，众多隐匿病灶被重新发现，说明患病率真的在上升。';
  assert.strictEqual(hitI(s), true, 'ZH3 直缀形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_ZH6: [] }), true, 'ZH6 置空影响了 ZH3 直缀形（副词必填应隔离）');
});
check('F 边界锁：ZH5 名词后置形非 ZH2 整词后置形（ZH2 置空不影响 ZH5 承重）', () => {
  const s = '检查普及让大量潜伏病例浮现出来，这说明患病率真的在上升。';
  assert.strictEqual(hitI(s), true, 'ZH5 形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_ZH2: [] }), true, 'ZH2 置空影响了 ZH5 浮现形');
});
check('F 边界锁：ZH6(腿①族) p2 名词中介严格（检测流程更新不匹配腿①）', () => {
  assert.strictEqual(hitI('检测流程更新让更多病例被重新发现，这说明患病率真的在上升。'), false, '名词中介形误判');
});
check('F 边界锁：腿③族不收走高（走高由 legacy p1 承重，ZH3 腿③族置空不影响）', () => {
  const s = '检查普及让更多病例被重新发现，患病率节节走高。';
  assert.strictEqual(hitI(s), true, 'legacy p1 走高形应命中');
  assert.strictEqual(hitI(s, { INCIDENCE_CLAIM_ZH3: [] }), true, '腿③族置空影响了 legacy 走高形');
});
check('F 边界锁：腿③族否定后置豁免（患病率可能并没有走强）', () => {
  assert.strictEqual(hitI('检查普及让更多病例被重新发现，患病率可能并没有走强。'), false, '否定后置未豁免');
});
check('F 边界锁：跨腿邻近窗（ZH 三腿相隔 >160 字符不判）', () => {
  const filler = '这是一段完全无关的社区活动筹备说明，涵盖场地预订、桌椅数量核对、音响设备调试、志愿者排班、天气与交通提醒、为期两周的准备窗口、附件表格里的预算与物资清单、已经用邮件发出的会议通知，以及任何临时变动都会在群里同步。感谢大家的配合，期待活动顺利举行、出席率良好、现场执行顺畅。第二部分补充说明：彩排时间定在周四晚上，签到台需要两名志愿者，餐饮供应商会提前一天把食材送到现场，停车位有限请大家尽量拼车前往，现场网络由场地方提供，备用方案是移动热点。';
  const s = '检查普及让大量潜伏病例' + filler + '浮现出来，这说明患病率真的在上升。';
  assert.ok(s.indexOf('浮现出来') > 160, '样本腿②跨度未超窗（样本构造失败）');
  assert.strictEqual(hitI(s), false, '跨腿窗失效');
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
check('G __internals 暴露四新族常量且元素数符合登记（ZH5 恰 1 / ZH6 恰 1 / DETECT_UP_ZH6 恰 2 / INCIDENCE_CLAIM_ZH3 恰 1 形）', () => {
  const I = immortalInternals();
  assert.ok(Array.isArray(I.CASE_SURGE_ZH5) && I.CASE_SURGE_ZH5.length === 1, 'CASE_SURGE_ZH5 应为 1 形');
  assert.ok(Array.isArray(I.CASE_SURGE_ZH6) && I.CASE_SURGE_ZH6.length === 1, 'CASE_SURGE_ZH6 应为 1 形');
  assert.ok(Array.isArray(I.DETECT_UP_ZH6) && I.DETECT_UP_ZH6.length === 2, 'DETECT_UP_ZH6 应为 2 形');
  assert.ok(Array.isArray(I.INCIDENCE_CLAIM_ZH3) && I.INCIDENCE_CLAIM_ZH3.length === 1, 'INCIDENCE_CLAIM_ZH3 应为 1 形');
});

console.log(`\n负例注入汇总: ${flipCount}/${flipTotal} 个翻转断言全部翻转`);
console.log(`round-356 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
