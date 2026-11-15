'use strict';
/**
 * test/round-354-pathh-leg2-passive-surfaced-verbfront-leg1-coverage.test.js
 * [r354] 路径 (h) 三个新措辞家族（真升级类型②：已有维度的全新措辞家族，
 * 维度计数 256 不变、src/index.js 零改动、VERSION 6.8.185 不 bump，同
 * r339–r353 先例：族内补形不 bump）。
 *
 * r354 立项探针（coordination/agent4/probes/r354-probe-candidates.js，集成
 * 树 v6.8.185 gate() 全量 findings 口径）定拨 r353 交接项剩余缺口：
 *   候选① leg② were/was + surfaced/uncovered 无形容词量化形（EN 专项）：
 *     攻击 6 穿透 5（1 条被 fallacy_of_relevance 代拦，不截胡纪律）、良性
 *     4 中 1 非 pass 为既有 post_hoc 基线（无腿③，路径 h 不判）、控制 2/2
 *     （were+found / 形容词+were+surfaced 已被 EN2 p4/EN3 p3 承重）→ 落地
 *     CASE_SURGE_EN7；
 *   候选② leg②动词前置裸过去时（EN 专项）：(a) pick stem legacy p10 缺、
 *     (b) 动词+形容词量化无 more/has/were——②a 攻击 4 穿透 3、良性 0/3；
 *     ②b 攻击 4 穿透 3（1 条 fallacy_of_relevance 代拦）、良性 1/3 为既有
 *     post_hoc 基线，控制 2/2（has surfaced+形容词 / surfaced+adverb+more
 *     已被 EN3 p6/legacy p10 承重）→ 合并落地 CASE_SURGE_EN8；
 *   候选③ leg① testing/screening + coverage/intensity/reach + 扩张动词
 *     （EN 专项）：攻击 4 穿透 3（1 条 screening-intensity 已被 LEAD_SCREEN
 *     承重，按设计非缺口）、良性 0/3、控制 2/2（expansion of testing
 *     capacity / screening coverage expanded 已被 EN4 p6/LEAD_SCREEN 承重）
 *     → 落地 DETECT_UP_EN6；
 *   候选④ ZH 双缺口（leg① 更先进+检测手段 + leg② 浮出+潜伏病例）攻击 2/3
 *     穿透、需两家族（单补一腿不闭合）→ 不立项（交接）；
 *   候选 E Berkson 住院选择形 4/4 穿透、需改共享常量 collider_bias COND_EN
 *     → 不立项（第五次留交）。
 * 海外扫描：arXiv 查询词被 OR 拆散宽泛返回、GitHub total_count 0、S2 429
 * 限流——空返，按既有形态自建，未编造命中。
 *
 * 补丁（src/immortal-time-bias.js，既有路径与常量零改动，只追加 + 主块
 * 接线 + __internals 登记）：
 *   · 新增 CASE_SURGE_EN7（腿②第七族 1 形：[副词] more + 病例名词 +
 *     were/was + surfaced/uncovered——EN2 p4 动词表缺 surfaced/uncovered、
 *     EN3 p3 须形容词组，more 前置无形）；
 *   · 新增 CASE_SURGE_EN8（腿②第八族 2 形：(a) pick(ed/s) up + [副词] more
 *     + 病例名词——legacy p10 词干表缺 pick、EN3 p4/p5 须 got/gets/getting；
 *     (b) 裸过去时检出动词 + 形容词量化组 + 病例名词——EN3 p6 须 has/have
 *     前缀（(?<!\bhas\s)(?<!\bhave\s) 负向断言隔离）、legacy p10 须 more）；
 *   · 新增 DETECT_UP_EN6（腿①第七族 1 形：testing/surveillance/monitoring/
 *     scanning + coverage/intensity/reach/scope/breadth/volume/frequency +
 *     扩张动词——LEAD_SCREEN 只收 screen* 词根、DETECT_UP_EN/EN5 须形容词
 *     前缀、EN4 p6 须 expansion of + capacity 名词形）；
 *   · 路径 (h) 主块腿①七族、腿②八族取最早匹配。
 * 族独立常量（EN6/EN7/EN8 后缀）而非追加既有家族表：r346–r353 八轮测以精确
 * equality/注入钉死既有常量元素数与承重，追加会打破存量断言——独立族零触碰
 * 存量测试（r338/r348–r353 先例）。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 gate+模块 + 官方
 *   语料全量 + 既有基线句隔离）/ D 存量回归（r346–r353 + 路径 a-g + 常量
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
// ① leg② were/was + surfaced/uncovered 无形容词量化形（EN 6；腿①由
// DETECT_UP_EN5/LEAD_SCREEN/DETECT_UP_EN、腿③由 INCIDENCE_CLAIM_EN/EN3 承重）
const ATTACK_L2_PASSIVE = [
  'Thanks to sensitive testing, far more cases were surfaced, which indicated the disease was genuinely becoming more widespread.',
  'With widespread screening, many more tumors were uncovered, which suggests the cancer is really becoming more common.',
  'More precise testing means far more cases were surfaced, indicating the disease is truly on the rise.',
  'With better screening, far more lesions were surfaced, suggesting the cancer is really on the rise.',
  'Once testing coverage expanded, many more cases were uncovered, which showed the disease was truly becoming more widespread.',
  // 扩展形：improved surveillance + infections 名词（EN5 不收 were，EN7 专属）
  'After improved surveillance, many more infections were uncovered, which shows the illness is genuinely spreading.',
];
// ② leg②动词前置裸过去时（EN 5：(a) pick stem 3 + (b) 动词+形容词 2；腿①由
// DETECT_UP_EN5/LEAD_SCREEN/DETECT_UP_EN、腿③由 INCIDENCE_CLAIM_EN/EN2 承重）
const ATTACK_L2_VERBFRONT = [
  // (a) pick stem
  'Advanced testing picked up far more tumors than before, suggesting the cancer is truly becoming more common.',
  'Thanks to sensitive testing, the scan picked up many more lesions, indicating the disease is genuinely spreading.',
  'Improved surveillance picked up many more infections, which shows the illness is really becoming more common.',
  // (b) 动词 + 形容词量化（numerous hidden / numerous additional）
  'Thanks to sensitive testing, the audit surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.',
  'With widespread screening, the program surfaced numerous additional infections, suggesting the illness is really spreading.',
];
// ③ leg① testing/surveillance + coverage/intensity/reach + 扩张动词（EN 4；
// 腿②由 legacy/CASE_SURGE_EN6、腿③由 INCIDENCE_CLAIM_EN 承重）
const ATTACK_L1_COVERAGE = [
  'With testing intensity increased, far more cases are being identified, suggesting the disease is really on the rise.',
  'Once testing coverage was extended to all districts, many more tumors were found, which suggests the cancer is truly becoming more common.',
  'As testing coverage expanded, diagnosed case numbers climbed steadily, which suggests the disease is really becoming more common.',
  'With surveillance reach broadened, many more lesions are being detected, indicating the cancer is genuinely spreading.',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：腿② were/was+surfaced 族攻击 6/6 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2_PASSIVE) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿②动词前置裸过去时族攻击 5/5 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2_VERBFRONT) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿①覆盖/强度扩张族攻击 4/4 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L1_COVERAGE) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：三新族攻击 15/15 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of [...ATTACK_L2_PASSIVE, ...ATTACK_L2_VERBFRONT, ...ATTACK_L1_COVERAGE]) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // 腿①覆盖扩张孪生：无病例激增腿或无发生率结论腿
  'With testing intensity increased, the clinic processed more samples per day.',
  'As testing coverage expanded, turnaround times improved markedly.',
  'Once testing coverage was extended to all districts, the lab standardized its reporting workflow.',
  // 腿②被动浮现孪生：were+surfaced 但无发生率结论腿
  'Thanks to sensitive testing, far more dormant lesions were surfaced during the audit and logged for review.',
  'The improved protocol surfaced many more historical cases in the registry, and the data team flagged them for follow-up.',
  // 腿②动词前置孪生：无腿①（检出域词）或无腿③
  'The new scanner picked up many more incidental findings, and radiology flagged them for review.',
  'Thanks to sensitive testing, the scan picked up many more lesions, and turnaround times improved markedly.',
  'The audit surfaced numerous additional infections in the registry, and the team logged them for follow-up.',
  // 良性工程产能句（无病例激增与发生率结论腿）
  'The radiology department reports that more images are being processed per day after the system upgrade.',
  // r353 既有良性（防本轮回归）
  'The lab adopted more sensitive testing, and turnaround times improved markedly.',
];
check('C 良性零误伤：三新族手工良性 11/11 gate 层 pass 且模块级不判', () => {
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
// 探针中谨慎解读形（"though the true incidence appears stable once
// ascertainment is accounted for"）被既有 post_hoc 维度在 gate 层代拦——立项
// 探针已实证为既有基线（该形无腿③，路径 h 不判，post_hoc 独立承重），这里钉死
// 模块级路径 h 不判、findings 不由 immortal_time_bias 承重
const BASELINE_FP = [
  'Thanks to sensitive testing, far more cases were surfaced, though the true incidence appears stable once ascertainment is accounted for.',
  'Thanks to sensitive testing, the audit surfaced numerous hidden cases, though the true incidence appears stable once ascertainment is accounted for.',
];
check('C 既有基线隔离：2 条谨慎解读形 gate 层非 pass 均非 immortal_time_bias 承重、模块级路径 h 不判', () => {
  for (const s of BASELINE_FP) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '应仍被既有维度(post_hoc)代拦: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(!f, '不应由 immortal_time_bias 承重（否则为本轮新增误伤）: ' + s);
    assert.strictEqual(hitI(s), false, '模块级路径 h 误判: ' + s);
  }
});

// ─── D. 存量回归 ──────────────────────────────────────────────────
check('D 存量回归：r346–r353 路径 h 攻击仍命中（注入三新族置空不受影响）', () => {
  const stock = [
    // r346 腿② legacy 激增形 + 腿③现在时
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    // r347 腿①检出能力变动 + 腿②旧族
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    // r348 腿②被动浮现 EN2（were caught——EN7 不得 rescue）
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
  ];
  for (const s of stock) {
    assert.strictEqual(hitI(s), true, '存量回归失效: ' + s);
    assert.strictEqual(hitI(s, { DETECT_UP_EN6: [], CASE_SURGE_EN7: [], CASE_SURGE_EN8: [] }), true, '被三新族置空误伤: ' + s);
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
  // r353 既有新族常量元素数不变
  assert.strictEqual(I.DETECT_UP_EN5.length, 1, 'DETECT_UP_EN5 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN6.length, 2, 'CASE_SURGE_EN6 应保持 2');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
let flipCount = 0, flipTotal = 0;
const flip = (cond, msg) => { flipTotal++; if (cond) flipCount++; else throw new Error(msg); };
check('E 注入 CASE_SURGE_EN7=[] → 腿② were/was+surfaced 族攻击 6/6 翻转不判', () => {
  for (const s of ATTACK_L2_PASSIVE) flip(hitI(s, { CASE_SURGE_EN7: [] }) === false, '删 CASE_SURGE_EN7 后仍命中: ' + s);
});
check('E 注入 CASE_SURGE_EN8=[] → 腿②动词前置族攻击 5/5 翻转不判', () => {
  for (const s of ATTACK_L2_VERBFRONT) flip(hitI(s, { CASE_SURGE_EN8: [] }) === false, '删 CASE_SURGE_EN8 后仍命中: ' + s);
});
check('E 注入 DETECT_UP_EN6=[] → 腿①覆盖/强度扩张族攻击 4/4 翻转不判', () => {
  for (const s of ATTACK_L1_COVERAGE) flip(hitI(s, { DETECT_UP_EN6: [] }) === false, '删 DETECT_UP_EN6 后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_EN=0 → 三新族攻击 15/15 全部翻转不判（窗承重）', () => {
  for (const s of [...ATTACK_L2_PASSIVE, ...ATTACK_L2_VERBFRONT, ...ATTACK_L1_COVERAGE]) flip(hitI(s, { WIN_LEAD_EN: 0 }) === false, '清零 EN 窗后仍命中: ' + s);
});
// ─── 族隔离反向硬探针：删旧常量后其独担句必须翻转，三新族不得 rescue ───
check('E 族隔离硬探针（反向）：DETECT_UP_EN=[] → r347 检出能力变动独担句 3/3 仍翻转不判（覆盖扩张族不得 rescue）', () => {
  const r347en = [
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
  ];
  for (const s of r347en) flip(hitI(s, { DETECT_UP_EN: [] }) === false, '删 DETECT_UP_EN 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_EN4=[] → r350 腿①名词化独担句 3/3 仍翻转不判（覆盖扩张族 testing-first 不得 rescue expansion-of 形）', () => {
  const r350en4 = [
    'The widespread adoption of CT scans has identified many more tumors, which shows the cancer is truly becoming more prevalent.',
    'Mass testing campaigns have detected many more cases, which suggests the disease is truly spreading.',
    'The expansion of testing capacity meant far more cases were identified, which suggests the disease is really becoming more widespread.',
  ];
  for (const s of r350en4) flip(hitI(s, { DETECT_UP_EN4: [] }) === false, '删 DETECT_UP_EN4 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：LEAD_SCREEN_EN=[] → r346 裸筛查独担句 3/3 仍翻转不判（覆盖扩张族须 coverage/intensity+动词，不得 rescue 裸筛查句）', () => {
  const r346en = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
  ];
  for (const s of r346en) flip(hitI(s, { LEAD_SCREEN_EN: [] }) === false, '删 LEAD_SCREEN_EN 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN=[] → r346 腿② legacy 独担句 3/3 仍翻转不判', () => {
  const r346en = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
  ];
  for (const s of r346en) flip(hitI(s, { CASE_SURGE_EN: [] }) === false, '删 CASE_SURGE_EN 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN2=[] → r348 were+caught 独担句 2/2 仍翻转不判（EN7 动词 surfaced/uncovered 不得 rescue caught/found）', () => {
  const r348en2 = [
    'As screening became more widespread, many more tumors were caught, and the disease appears to be spreading.',
    'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
  ];
  for (const s of r348en2) flip(hitI(s, { CASE_SURGE_EN2: [] }) === false, '删 CASE_SURGE_EN2 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN3=[] → r349 被动深形独担句 3/3 仍翻转不判（EN7 more-前置 / EN8(b) has-have 负向断言 不得 rescue 形容词+were / has+surfaced）', () => {
  const r349en3 = [
    'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
    'Thanks to sensitive testing, the audit has surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.',
    'Thanks to better surveillance, far more infections got picked up, indicating the disease is truly on the rise.',
  ];
  for (const s of r349en3) flip(hitI(s, { CASE_SURGE_EN3: [] }) === false, '删 CASE_SURGE_EN3 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN5=[] → r352 infections/illnesses 单助动词独担句 3/3 仍翻转不判（EN7/EN8 不得 rescue have been / are 形）', () => {
  const r352en5 = [
    'Thanks to ubiquitous testing, many more infections have been identified, which suggests the disease is really becoming more widespread.',
    'With wider screening, far more illnesses have been detected, indicating the disease is genuinely on the rise.',
    'Screening identified many more infections, which suggests the disease is really on the rise.',
  ];
  for (const s of r352en5) flip(hitI(s, { CASE_SURGE_EN5: [] }) === false, '删 CASE_SURGE_EN5 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_EN5=[] → r353 testing 名词独担句 2/2 仍翻转不判（覆盖扩张族 coverage-动词 不得 rescue 形容词+testing）', () => {
  const r353en5 = [
    'With advanced testing, far more cases are being detected, suggesting the cancer is truly spreading.',
    'More accurate testing means many more tumors are being picked up, indicating the disease is really on the rise.',
  ];
  for (const s of r353en5) flip(hitI(s, { DETECT_UP_EN5: [] }) === false, '删 DETECT_UP_EN5 后被新族承重不翻转: ' + s);
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hitI('With better screening, far more lesions were surfaced — is the cancer truly on the rise?'), false, '疑问形未豁免');
});
check('F 边界锁：缺检出腿不判（腿②+腿③齐全，无普及/检出域词）', () => {
  assert.strictEqual(hitI('Far more cases were surfaced this quarter, which suggests the disease is truly becoming more widespread.'), false, '缺腿①仍判');
});
check('F 边界锁：缺病例激增腿不判（腿①+腿③齐全）', () => {
  assert.strictEqual(hitI('With testing intensity increased, the data suggests the disease is truly becoming more common.'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（腿①+腿②齐全）', () => {
  assert.strictEqual(hitI('With testing intensity increased, far more cases were surfaced.'), false, '缺腿③仍判');
});
check('F 边界锁：EN7 被动形非 EN8(b) 动词前置形（EN8 置空不影响 were surfaced 承重）', () => {
  const s = 'Thanks to sensitive testing, far more cases were surfaced, which indicated the disease was genuinely becoming more widespread.';
  assert.strictEqual(hitI(s), true, 'EN7 形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN8: [] }), true, 'EN8 置空影响了 EN7 被动形');
});
check('F 边界锁：EN8(b) 动词前置形非 EN7 被动形（EN7 置空不影响 surfaced numerous 承重）', () => {
  const s = 'Thanks to sensitive testing, the audit surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.';
  assert.strictEqual(hitI(s), true, 'EN8(b) 形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN7: [] }), true, 'EN7 置空影响了 EN8(b) 动词前置形');
});
check('F 边界锁：EN8(b) has-have 前缀形由 EN3 p6 专属（EN8 置空后 has surfaced 仍由 EN3 承重）', () => {
  const s = 'Thanks to sensitive testing, the audit has surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.';
  assert.strictEqual(hitI(s), true, 'has surfaced 形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN8: [] }), true, 'EN8 置空影响了 has surfaced 形（不应——负向断言应隔离）');
});
check('F 边界锁：覆盖扩张族非 screening 裸词（DETECT_UP_EN6 置空后 screening coverage expanded 仍由 LEAD_SCREEN 承重）', () => {
  const s = 'As screening coverage expanded, many more tumors were found, which suggests the cancer is truly becoming more common.';
  assert.strictEqual(hitI(s), true, 'screening coverage expanded 形应命中');
  assert.strictEqual(hitI(s, { DETECT_UP_EN6: [] }), true, 'EN6 置空影响了 screening coverage expanded（不应——screening 由 LEAD_SCREEN 承重）');
});
check('F 边界锁：testing 覆盖扩张形确由 EN6 承重（LEAD_SCREEN 置空后 testing coverage 形仍命中）', () => {
  const s = 'Once testing coverage was extended to all districts, many more tumors were found, which suggests the cancer is truly becoming more common.';
  assert.strictEqual(hitI(s), true, 'testing coverage 形应命中');
  assert.strictEqual(hitI(s, { LEAD_SCREEN_EN: [] }), true, 'LEAD_SCREEN 置空后 testing coverage 形失效（testing 不在 LEAD_SCREEN，应由 EN6 承重）');
});
check('F 边界锁：跨腿邻近窗（三腿相隔 >400 字符不判）', () => {
  const filler = 'This paragraph is an unrelated community-event planning note covering venue booking, table and chair counts, sound-system debugging, volunteer scheduling, weather and transit reminders, a two-week preparation window, budget and supply lists in an attached spreadsheet, meeting notices already sent by email, and any last-minute changes will be synced in the group chat. Thanks to everyone for cooperating, and we look forward to a successful event with good attendance and smooth on-site execution throughout the day.';
  const s = 'With testing intensity increased, ' + filler + ' far more cases were surfaced, suggesting the cancer is truly spreading.';
  assert.ok(s.length - s.indexOf('With testing intensity increased') > 400, '样本跨度未超窗（样本构造失败）');
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
check('G __internals 暴露三新族常量且元素数符合登记（EN6 恰 1 / EN7 恰 1 / EN8 恰 2 形）', () => {
  const I = immortalInternals();
  assert.ok(Array.isArray(I.DETECT_UP_EN6) && I.DETECT_UP_EN6.length === 1, 'DETECT_UP_EN6 应为 1 形');
  assert.ok(Array.isArray(I.CASE_SURGE_EN7) && I.CASE_SURGE_EN7.length === 1, 'CASE_SURGE_EN7 应为 1 形');
  assert.ok(Array.isArray(I.CASE_SURGE_EN8) && I.CASE_SURGE_EN8.length === 2, 'CASE_SURGE_EN8 应为 2 形');
});

console.log(`\n负例注入汇总: ${flipCount}/${flipTotal} 个翻转断言全部翻转`);
console.log(`round-354 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
