'use strict';
/**
 * round-355 轮测：路径 (h) 剩余缺口三族落地验证
 *   · 新增 CASE_SURGE_EN9（腿②第九族 2 形，EN 专项）：(a) pick(ed/s) up +
 *     [副词] more + 形容词 + 病例名词（EN8(a) 须 more+名词紧跟、legacy p10
 *     词干表缺 pick）；(b) [副词 more] + [形容词量化] + 病例名词 + 裸过去时
 *     surfaced/uncovered/emerged 无助动词形（EN8(b) 动词前置、EN3 p3/EN7 须
 *     were/was、EN3 p6 须 has/have、legacy p10 动词前置）。
 *   · 新增 DETECT_UP_ZH5（腿①第八族 1 形，ZH 专项）：形容词 + [影像/CT 类] +
 *     检查/检测/检验/诊断 + 技术/手段/方法/工具/设备/应用/方式（DETECT_UP_ZH
 *     须 进步/普及 后缀、LEAD_SCREEN_ZH 只收筛查域显式词）。
 *   · 新增 CASE_SURGE_ZH4（腿②第十族 1 形，ZH 专项）：浮出/浮现出/暴露/显露/
 *     曝出 + [出] + [量词] + [形容词] + [的] + 病例名词（ZH2 须浮出水面后置、
 *     ZH3 须 被+发现）。
 * 主块腿①八族/腿②十族取最早匹配；族独立常量仿 r338/r348–r354 先例，src/index.js
 * 零改动，维度 256 不变，VERSION 不 bump。
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 gate+模块 + 官方
 *   语料全量 + 既有基线句隔离）/ D 存量回归（r346–r354 + 路径 a-g + 常量
 *   元素数）/ E 常量级注入-删条承重（逐族 + 窗 + 族隔离双向硬探针）/ F 边界
 *   lock / G 登记纪律。
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
// ① leg② pick + more + 形容词 + 名词（EN 4；腿①由 DETECT_UP_EN5/EN6/LEAD_SCREEN、
// 腿③由 INCIDENCE_CLAIM_EN 承重）
const ATTACK_L2_PICKADJ = [
  'With sensitive testing, the scan picked up far more early-stage tumors, suggesting the cancer is truly becoming more common.',
  'Thanks to improved testing, the assay picked up many more small lesions, indicating the disease is genuinely spreading.',
  'After testing coverage expanded, the program picked up significantly more indolent cancers, which shows the illness is really becoming more widespread.',
  'With wider screening, the clinic picked up far more early-stage cases, suggesting the disease is truly on the rise.',
];
// ② leg② 量化 + 名词 + 裸过去时无助动词（EN 4；腿①由 DETECT_UP_EN5/EN6/EN4、
// 腿③由 INCIDENCE_CLAIM_EN 承重）
const ATTACK_L2_BAREPAST = [
  'With sensitive testing, numerous additional cases surfaced, proving the disease is becoming more common.',
  'Thanks to improved surveillance, many previously hidden infections surfaced, suggesting the illness is really spreading.',
  'After testing coverage expanded, numerous silent cases surfaced, which indicates the cancer is truly becoming more widespread.',
  'With widespread testing, far more cases surfaced, showing the disease is genuinely on the rise.',
];
// ③ ZH leg① 形容词前置检出手段形（4；腿②由 CASE_SURGE_ZH3、腿③由 INCIDENCE_CLAIM_ZH 承重）
const ATTACK_L1_ZH_ADJ = [
  '随着更灵敏的影像检查应用，大量病例被重新发现，表明这种病真的在变多。',
  '新型的检验技术上线后，大量无症状感染者被确诊，表明患病率确实在提高。',
  '更先进的诊断方法应用后，众多潜伏病例被识别出来，说明发病率确实在升高。',
  '随着更精确的检验手段应用，大批隐匿病灶被查出，表明这种病真的在蔓延。',
];
// ④ ZH leg② 浮出/暴露动词前置形（4；腿①由 DETECT_UP_ZH/LEAD_SCREEN_ZH、
// 腿③由 INCIDENCE_CLAIM_ZH 承重）
const ATTACK_L2_ZH_VERBFRONT = [
  '随着检测普及，浮出大量潜伏病例，这说明这种病真的在变多。',
  '筛查推广后，浮现出许多无症状感染者，表明患病率确实在升高。',
  '体检普及以来，暴露出越来越多隐匿病灶，说明癌症真的高发了。',
  '普筛开展后，显露出大量以往漏诊的病例，表明发病率真的在上升。',
];
// ⑤ ZH 双缺口组合（腿① DETECT_UP_ZH5 + 腿② CASE_SURGE_ZH4 齐落地才闭合）
const ATTACK_ZH_DUAL = [
  '更先进的检测手段浮出大量潜伏病例，这说明这种病真的在变多。',
  '随着更精准的检查技术应用，浮出众多以往漏诊的病例，表明发病率确实在上升。',
  '新型检验技术上线后，暴露出大量无症状感染者，说明患病率真的在提高。',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：腿② pick+more+形容词族攻击 4/4 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2_PICKADJ) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿②名词+裸过去时族攻击 4/4 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2_BAREPAST) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：ZH 腿①形容词前置族攻击 4/4 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L1_ZH_ADJ) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：ZH 腿②浮出动词前置族攻击 4/4 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2_ZH_VERBFRONT) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：ZH 双缺口组合攻击 3/3 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_ZH_DUAL) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：三新族攻击 19/19 命中且 detail 带过度诊断发生率误读标', () => {
  for (const s of [...ATTACK_L2_PICKADJ, ...ATTACK_L2_BAREPAST, ...ATTACK_L1_ZH_ADJ, ...ATTACK_L2_ZH_VERBFRONT, ...ATTACK_ZH_DUAL]) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence') || r.detail.includes('过度诊断发生率误读'), 'detail 缺标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // 腿② pick+形容词孪生：无腿①或无腿③
  'The new protocol picked up far more early-stage tumors in the pilot, and the radiology team logged them for review.',
  'Better imaging picked up many more small nodules, most of which were benign on follow-up.',
  // 腿②裸过去时孪生：谨慎解读/无腿③
  'With sensitive testing, numerous additional cases surfaced, but the actual prevalence does not appear to be rising.',
  'Numerous additional historical cases surfaced during the audit, and the data team flagged them for follow-up.',
  'Many previously hidden infections surfaced in the registry review, prompting a quality improvement project.',
  // 谨慎解读形（EXEMPT_INC_ZH (a) 否定前置）
  '更先进的检测手段让更多早期肿瘤被检出，但这并不代表发病率真的上升。',
  '随着检测普及，浮出大量潜伏病例，但这并不代表发病率真的上升。',
  // 无腿②/腿③孪生
  '更先进的检测手段有助于早发现早治疗，是体检中心的常规推荐。',
  '筛查推广后浮现出的无症状感染者，均已纳入随访名单。',
  '普筛后暴露出不少问题环节，质检部门正在整改。',
  '更先进的检测手段浮出大量潜伏病例，但真实发病率可能并没有上升。',
  'With sensitive testing, the scan picked up far more early-stage tumors, though the true incidence appears stable.',
];
check('C 良性零误伤：三新族手工良性 12/12 模块级路径 h 不判', () => {
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
// 探针中 2 条谨慎解读/工程形被既有维度在 gate 层代拦——立项探针已实证为既有
// 基线（无腿②/腿③，路径 h 不判，pseudo_causal/reverse_causation 独立承重），
// 这里钉死模块级路径 h 不判、findings 不由 immortal_time_bias 承重
const BASELINE_FP = [
  '新型检验技术上线后，实验室周转时间明显缩短，成本下降了三成。',
  '更先进的检测手段提高了早期确诊比例，实验室周转时间明显缩短。',
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
check('D 存量回归：r346–r354 路径 h 攻击仍命中（注入三新族置空不受影响）', () => {
  const stock = [
    // r346 腿② legacy 激增形 + 腿③现在时
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    // r347 腿①检出能力变动 + 腿②旧族
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    // r348 腿②被动浮现 EN2（were caught——EN9 不得 rescue）
    'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
    'As screening became more widespread, many more tumors were caught, and the disease appears to be spreading.',
    // r349 腿②被动深形 EN3（were brought to light / has surfaced + 形容词）
    'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
    'Thanks to sensitive testing, the audit has surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.',
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
  ];
  for (const s of stock) {
    assert.strictEqual(hitI(s), true, '存量回归失效: ' + s);
    assert.strictEqual(hitI(s, { DETECT_UP_ZH5: [], CASE_SURGE_EN9: [], CASE_SURGE_ZH4: [] }), true, '被三新族置空误伤: ' + s);
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
  // r353–r354 既有新族常量元素数不变
  assert.strictEqual(I.DETECT_UP_EN5.length, 1, 'DETECT_UP_EN5 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN6.length, 2, 'CASE_SURGE_EN6 应保持 2');
  assert.strictEqual(I.DETECT_UP_EN6.length, 1, 'DETECT_UP_EN6 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN7.length, 1, 'CASE_SURGE_EN7 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN8.length, 2, 'CASE_SURGE_EN8 应保持 2');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
let flipCount = 0, flipTotal = 0;
const flip = (cond, msg) => { flipTotal++; if (cond) flipCount++; else throw new Error(msg); };
check('E 注入 CASE_SURGE_EN9=[] → pick+形容词族攻击 4/4 翻转不判', () => {
  for (const s of ATTACK_L2_PICKADJ) flip(hitI(s, { CASE_SURGE_EN9: [] }) === false, '删 CASE_SURGE_EN9 后 pick+形容词形仍命中: ' + s);
});
check('E 注入 CASE_SURGE_EN9=[] → 名词+裸过去时族攻击 4/4 翻转不判', () => {
  for (const s of ATTACK_L2_BAREPAST) flip(hitI(s, { CASE_SURGE_EN9: [] }) === false, '删 CASE_SURGE_EN9 后裸过去时形仍命中: ' + s);
});
check('E 注入 DETECT_UP_ZH5=[] → ZH 腿①形容词前置族攻击 4/4 翻转不判', () => {
  for (const s of ATTACK_L1_ZH_ADJ) flip(hitI(s, { DETECT_UP_ZH5: [] }) === false, '删 DETECT_UP_ZH5 后仍命中: ' + s);
});
check('E 注入 CASE_SURGE_ZH4=[] → ZH 腿②浮出动词前置族攻击 4/4 翻转不判', () => {
  for (const s of ATTACK_L2_ZH_VERBFRONT) flip(hitI(s, { CASE_SURGE_ZH4: [] }) === false, '删 CASE_SURGE_ZH4 后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_EN=0 → EN 两族攻击 8/8 全部翻转不判（窗承重）', () => {
  for (const s of [...ATTACK_L2_PICKADJ, ...ATTACK_L2_BAREPAST]) flip(hitI(s, { WIN_LEAD_EN: 0 }) === false, '清零 EN 窗后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_ZH=0 → ZH 两族+组合攻击 11/11 全部翻转不判（窗承重）', () => {
  for (const s of [...ATTACK_L1_ZH_ADJ, ...ATTACK_L2_ZH_VERBFRONT, ...ATTACK_ZH_DUAL]) flip(hitI(s, { WIN_LEAD_ZH: 0 }) === false, '清零 ZH 窗后仍命中: ' + s);
});
// ─── 族隔离反向硬探针：删旧常量后其独担句必须翻转，三新族不得 rescue ───
check('E 族隔离硬探针（反向）：DETECT_UP_ZH=[] → 普及/进步后缀独担句 2/2 仍翻转不判（ZH5 形容词前置形不得 rescue 后缀形）', () => {
  // 腿②避开"被检出"（LEAD_SCREEN_ZH 已收"检出"——纯独担句预判）
  const zh = [
    '检测手段的进步让更多病例被查出，这说明患病率真的在上升。',
    '检查的普及让更多病例被查出，这说明患病率真的在上升。',
  ];
  for (const s of zh) flip(hitI(s, { DETECT_UP_ZH: [] }) === false, '删 DETECT_UP_ZH 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：LEAD_SCREEN_ZH=[] → 裸筛查域独担句 2/2 仍翻转不判（ZH5 检测手段形不得 rescue 筛查域词）', () => {
  const zh = [
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    '筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，这说明筛查确实有效。',
  ];
  for (const s of zh) flip(hitI(s, { LEAD_SCREEN_ZH: [] }) === false, '删 LEAD_SCREEN_ZH 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_ZH2=[] → 浮出水面后置独担句 1/1 仍翻转不判（ZH4 动词前置形不得 rescue 名词后置形）', () => {
  const s = '随着检测普及，大量潜伏病例浮出水面，这说明这种病真的在变多。';
  flip(hitI(s, { CASE_SURGE_ZH2: [] }) === false, '删 CASE_SURGE_ZH2 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_ZH3=[] → 被重新发现被动独担句 2/2 仍翻转不判（ZH4 裸动词前置形不得 rescue 被+发现形）', () => {
  const zh = [
    '筛查推广后，大量隐匿病例被重新发现，表明患病率确实在升高。',
    '更精确的检验手段应用后，大批隐匿病灶被查出，表明这种病真的在蔓延。',
  ];
  for (const s of zh) flip(hitI(s, { CASE_SURGE_ZH3: [] }) === false, '删 CASE_SURGE_ZH3 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN=[] → r346 腿② legacy 独担句 3/3 仍翻转不判（EN9 名词前置/pick 专属不得 rescue）', () => {
  const en = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
  ];
  for (const s of en) flip(hitI(s, { CASE_SURGE_EN: [] }) === false, '删 CASE_SURGE_EN 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN3=[] → r349 被动深形独担句 3/3 仍翻转不判（EN9 无助动词形不得 rescue were/was/has 形）', () => {
  const en = [
    'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
    'Thanks to sensitive testing, the audit has surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.',
    'Thanks to better surveillance, far more infections got picked up, indicating the disease is truly on the rise.',
  ];
  for (const s of en) flip(hitI(s, { CASE_SURGE_EN3: [] }) === false, '删 CASE_SURGE_EN3 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN7=[] → r354 were/was+surfaced 独担句 2/2 仍翻转不判（EN9(b) 无助动词不得 rescue were 形）', () => {
  // 纯 EN7 形预判：无形容词前缀（silent 形容词形由 EN3 p3 承重，非独担句）
  const en = [
    'Thanks to sensitive testing, far more cases were surfaced, which indicated the disease was genuinely becoming more widespread.',
    'Once testing coverage expanded, many more cases were uncovered, which showed the disease was truly becoming more widespread.',
  ];
  for (const s of en) flip(hitI(s, { CASE_SURGE_EN7: [] }) === false, '删 CASE_SURGE_EN7 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN8=[] → r354 动词前置独担句 3/3 仍翻转不判（EN9(a) 形容词必填不得 rescue 紧跟形）', () => {
  const en = [
    'Advanced testing picked up far more tumors than before, suggesting the cancer is truly becoming more common.',
    'Thanks to sensitive testing, the audit surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.',
    'Improved surveillance picked up many more infections, which shows the illness is really becoming more common.',
  ];
  for (const s of en) flip(hitI(s, { CASE_SURGE_EN8: [] }) === false, '删 CASE_SURGE_EN8 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_EN5=[] → r353 形容词+testing 独担句 2/2 仍翻转不判（ZH5 为中文专项不得 rescue EN 形）', () => {
  const en = [
    'With advanced testing, far more cases are being detected, suggesting the cancer is truly spreading.',
    'More accurate testing means many more tumors are being picked up, indicating the disease is really on the rise.',
  ];
  for (const s of en) flip(hitI(s, { DETECT_UP_EN5: [] }) === false, '删 DETECT_UP_EN5 后被新族承重不翻转: ' + s);
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hitI('随着检测普及，浮出大量潜伏病例——这说明这种病真的在变多吗？'), false, '疑问形未豁免');
});
check('F 边界锁：缺检出腿不判（腿②+腿③齐全，无普及/检出域词）', () => {
  assert.strictEqual(hitI('Numerous additional cases surfaced this quarter, which suggests the disease is truly becoming more widespread.'), false, '缺腿①仍判');
});
check('F 边界锁：缺病例激增腿不判（腿①+腿③齐全）', () => {
  assert.strictEqual(hitI('随着更精确的检验手段应用，检验科通过了iso认证，说明发病率确实在升高。'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（腿①+腿②齐全）', () => {
  assert.strictEqual(hitI('随着检测普及，浮出大量潜伏病例。'), false, '缺腿③仍判');
});
check('F 边界锁：EN9(a) 形容词必填（pick+more+名词紧跟形由 EN8(a) 专属，EN9 置空不影响）', () => {
  const s = 'Advanced testing picked up far more tumors than before, suggesting the cancer is truly becoming more common.';
  assert.strictEqual(hitI(s), true, 'EN8(a) 形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN9: [] }), true, 'EN9 置空影响了 EN8(a) 紧跟形（形容词必填应隔离）');
});
check('F 边界锁：EN9(b) 无助动词（were/was 被动形由 EN7/EN3 专属，EN9 置空不影响）', () => {
  const s = 'Thanks to sensitive testing, far more cases were surfaced, which indicated the disease was genuinely becoming more widespread.';
  assert.strictEqual(hitI(s), true, 'EN7 形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN9: [] }), true, 'EN9 置空影响了 were 被动形');
});
check('F 边界锁：ZH4 动词前置形非 ZH2 浮出水面后置形（ZH2 置空不影响 ZH4 承重）', () => {
  const s = '随着检测普及，浮出大量潜伏病例，这说明这种病真的在变多。';
  assert.strictEqual(hitI(s), true, 'ZH4 形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_ZH2: [] }), true, 'ZH2 置空影响了 ZH4 动词前置形');
});
check('F 边界锁：ZH5 形容词前置形非 DETECT_UP_ZH 后缀形（DETECT_UP_ZH 置空不影响 ZH5 承重）', () => {
  const s = '新型的检验技术上线后，大量无症状感染者被确诊，表明患病率确实在提高。';
  assert.strictEqual(hitI(s), true, 'ZH5 形应命中');
  assert.strictEqual(hitI(s, { DETECT_UP_ZH: [] }), true, 'DETECT_UP_ZH 置空影响了 ZH5 形容词前置形');
});
check('F 边界锁：跨腿邻近窗（EN 三腿相隔 >400 字符不判）', () => {
  const filler = 'This paragraph is an unrelated community-event planning note covering venue booking, table and chair counts, sound-system debugging, volunteer scheduling, weather and transit reminders, a two-week preparation window, budget and supply lists in an attached spreadsheet, meeting notices already sent by email, and any last-minute changes will be synced in the group chat. Thanks to everyone for cooperating, and we look forward to a successful event with good attendance and smooth on-site execution throughout the day.';
  const s = 'With sensitive testing, ' + filler + ' numerous additional cases surfaced, proving the disease is becoming more common.';
  assert.ok(s.length - s.indexOf('With sensitive testing') > 400, '样本跨度未超窗（样本构造失败）');
  assert.strictEqual(hitI(s), false, '跨腿窗失效');
});
check('F 边界锁：跨腿邻近窗（ZH 三腿相隔 >160 字符不判）', () => {
  const filler = '这是一段完全无关的社区活动筹备说明，涵盖场地预订、桌椅数量核对、音响设备调试、志愿者排班、天气与交通提醒、为期两周的准备窗口、附件表格里的预算与物资清单、已经用邮件发出的会议通知，以及任何临时变动都会在群里同步。感谢大家的配合，期待活动顺利举行、出席率良好、现场执行顺畅。第二部分补充说明：彩排时间定在周四晚上，签到台需要两名志愿者，餐饮供应商会提前一天把食材送到现场，停车位有限请大家尽量拼车前往，现场网络由场地方提供，备用方案是移动热点。';
  const s = '随着检测普及，' + filler + '浮出大量潜伏病例，这说明这种病真的在变多。';
  assert.ok(s.indexOf('浮出大量潜伏病例') > 160, '样本腿②跨度未超窗（样本构造失败）');
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
check('G __internals 暴露三新族常量且元素数符合登记（EN9 恰 2 / ZH5 恰 1 / ZH4 恰 1 形）', () => {
  const I = immortalInternals();
  assert.ok(Array.isArray(I.CASE_SURGE_EN9) && I.CASE_SURGE_EN9.length === 2, 'CASE_SURGE_EN9 应为 2 形');
  assert.ok(Array.isArray(I.DETECT_UP_ZH5) && I.DETECT_UP_ZH5.length === 1, 'DETECT_UP_ZH5 应为 1 形');
  assert.ok(Array.isArray(I.CASE_SURGE_ZH4) && I.CASE_SURGE_ZH4.length === 1, 'CASE_SURGE_ZH4 应为 1 形');
});

console.log(`\n负例注入汇总: ${flipCount}/${flipTotal} 个翻转断言全部翻转`);
console.log(`round-355 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
