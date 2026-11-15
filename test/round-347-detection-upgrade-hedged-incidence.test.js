'use strict';
/**
 * test/round-347-detection-upgrade-hedged-incidence.test.js
 * [r347] 路径 (h) 英文侧补族（真升级类型②：已有维度的全新措辞家族，维度
 * 计数 256 不变、src/index.js 零改动、VERSION 6.8.185 不变，同 r339–r346
 * 先例：族内加腿/补形不 bump）。
 *
 * r346 交接项①②落地（探针 coordination/agent4/probes/
 * r347-probe-candidates.js，集成树 v6.8.185 gate() 全量 findings 口径）：
 *   候选 A 检出率/监测加强形 × 发生率结论：攻击 8 条 EN 侧 3 条纯形穿引擎
 *     （detection rates have risen / improved surveillance / more sensitive
 *     imaging 三腿中腿①缺失），良性 5 条零误伤 → 落地；
 *   候选 B EN 弱化结论形：攻击 5 条 4 条穿透（appears/seems/looks to be
 *     rising、clearly climbing、truly on the rise），良性 2 条零误伤 → 落地；
 *   剩余 1 条穿透句（Case counts jumped this decade, suggesting the
 *     incidence may be somewhat higher）无筛查/检出腿在场——路径 h 族语义
 *     要求检出混淆前提，按设计不补（无检出变动的计数⇒发生率推断本身合法，
 *     该句留待泛维度或其他轮次处理，报告如实记录）。
 *   候选 C 诉诸传统/自然 EN 新形证伪不立项（3/4 已被 fallacy_of_relevance
 *   代拦，唯一穿透句边际且良性基线已有 FP）；候选 D 中介过度控制证伪
 *   （0/4 穿透，mediator_confusion/pseudo_causal 全覆盖）。
 *
 * 补丁（src/immortal-time-bias.js，既有路径与常量零改动，只追加）：
 *   · 新增 DETECT_UP_EN（路径 h 专属腿①第二族：检出能力变动形——improved
 *     detection / detection rates have risen / improved surveillance /
 *     more sensitive imaging / new imaging technology / more cases
 *     detected；中文侧探针实证 5/5 已拦截无缺口，本轮 EN 专项）
 *   · CASE_SURGE_EN 追加 5 形（裸助动词省略 Diagnosed cases tripled、
 *     rose 结尾、more cases (have been) detected、finds many more tumors、
 *     rising case count）
 *   · INCIDENCE_CLAIM_EN 追加 5 形（appears/seems/looks to be rising、
 *     is clearly/evidently/undoubtedly rising、may be somewhat higher、
 *     disease appears to be spreading、is truly on the rise）
 *   · EXEMPT_INC_EN 追加 2 形（true/actual incidence remains unchanged、
 *     though…true incidence stable——伴随新腿落地的防呆豁免）
 *   · 路径 (h) 主块腿①改两族取最早匹配；__internals 登记 DETECT_UP_EN
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方语料全量）
 *   / D 存量回归 / E 常量级注入-删条承重（逐族 + 窗 + 新豁免元素隔离 +
 *   族独立性）/ F 边界锁 / G 登记纪律。
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

// ─── 攻击集（EN 双侧族：检出能力变动 4 + 弱化结论 4）────────────────────
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
const ATTACK_EN = [...DET_EN, ...HED_EN];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：路径 h EN 新族攻击 9/9 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_EN) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：检出能力变动族 5/5 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of DET_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});
check('B 模块直调：弱化结论族 4/4 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of HED_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN_EN = [
  'Higher detection rates explain the surge in reported cases, but this does not mean the disease is becoming more common.',
  'Detection rates have risen and diagnosed cases have surged, and the disease seems to be spreading, but the true incidence remains unchanged.',
  'Screening has tripled the number of diagnosed cases and the disease appears to be spreading, though the actual incidence is stable.',
  'The number of diagnosed cases rose, but the incidence appears to be unchanged once detection improvements are accounted for.',
  'Improved surveillance finds more cases, though the true rate seems stable.',
  'Screening tripled diagnosed cases, so the incidence is rising — but that is better detection rather than a real increase.',
  'More cases were detected, though the true rate seems stable.',
  'As detection improves we find more tumors, but researchers caution this does not mean the cancer is becoming more common.',
  'Early detection has improved and we now find many more tumors, which is a genuine advance in cancer care.',
];
check('C 良性零误伤：路径 h EN 手工良性 9/9 模块级不判', () => {
  for (const s of BENIGN_EN) assert.strictEqual(hitI(s), false, '误判: ' + s);
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
      if (r.hit && r.detail.includes('overdiagnosis-incidence')) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  assert.ok(n >= 360, '语料条数不足: ' + n);
  assert.strictEqual(fp, 0, '路径 h 误伤 ' + fp + ' 条: ' + hits.join(' | '));
});

// ─── D. 存量回归 ──────────────────────────────────────────────────
check('D 存量回归：r346 路径 h 攻击 ZH 4 + EN 4 仍命中且 detail 标不变', () => {
  const R346_ZH = [
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
    '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
    '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
  ];
  const R346_EN = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
  ];
  for (const s of R346_ZH) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, 'r346 ZH 回归失效: ' + s);
    assert.ok(r.detail.includes('过度诊断发生率误读'), 'detail 缺标: ' + r.detail);
  }
  for (const s of R346_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, 'r346 EN 回归失效: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});
check('D 存量回归：路径 (a)(d)(e)(f)(g) 攻击仍命中', () => {
  assert.ok(checkImmortalTimeBias('治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。').hit, '路径 a 回归');
  assert.ok(checkImmortalTimeBias('肿瘤早筛让确诊时间平均提前了两年，患者的五年生存率因此大幅上升，可见筛查显著延长了寿命。').detail.includes('领先时间偏误'), '路径 d 回归');
  assert.ok(checkImmortalTimeBias('筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，这说明筛查确实有效。').detail.includes('病程长度偏误'), '路径 e 回归');
  assert.ok(checkImmortalTimeBias('早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。').detail.includes('过度诊断×'), '路径 f 回归');
  assert.ok(checkImmortalTimeBias('新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后。').detail.includes('Will Rogers'), '路径 g 回归');
});
check('D 存量回归：EXEMPT_LEAD 三元素与 WIN_LEAD 窗值不变', () => {
  const I = immortalInternals();
  assert.strictEqual(I.EXEMPT_LEAD_ZH.length, 3, 'EXEMPT_LEAD_ZH 元素数被改');
  assert.strictEqual(I.EXEMPT_LEAD_EN.length, 3, 'EXEMPT_LEAD_EN 元素数被改');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});
check('D 存量回归：r346 豁免探针仍豁免（谨慎否定/does-not-mean/检出解释）', () => {
  const probes = [
    '癌症筛查普及后新确诊的病例数成倍增长，但这并不代表发病率真的在上升。',
    'Screening has tripled the number of diagnosed cases, but this does not mean the incidence of the disease is really rising.',
    'Screening tripled diagnosed cases, so the incidence is rising — but that is better detection rather than a real increase.',
  ];
  for (const s of probes) assert.strictEqual(hitI(s), false, '豁免回归失效: ' + s);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
let flipCount = 0, flipTotal = 0;
const flip = (cond, msg) => { flipTotal++; if (cond) flipCount++; else throw new Error(msg); };
check('E 注入 DETECT_UP_EN=[] → 检出能力变动族 5/5 由判翻转不判', () => {
  for (const s of DET_EN) flip(hitI(s, { DETECT_UP_EN: [] }) === false, '删 DETECT_UP_EN 后仍命中: ' + s);
});
check('E 注入 CASE_SURGE_EN=[r346 旧 7 形] → 腿②新模式独担攻击 5/5 翻转不判', () => {
  const I = immortalInternals();
  const old = { CASE_SURGE_EN: I.CASE_SURGE_EN.slice(0, 7) };
  // 腿②由 r346 旧形承重的句（DET-1/DET-2/DET-5 旧 p1、HED-2 旧 p7）不在本注入翻转集
  const NEW_LEG2 = [DET_EN[2], DET_EN[3], HED_EN[0], HED_EN[2], HED_EN[3]];
  assert.strictEqual(NEW_LEG2.length, 5);
  for (const s of NEW_LEG2) flip(hitI(s, old) === false, '删腿②新模式后仍命中: ' + s);
});
check('E 注入 INCIDENCE_CLAIM_EN=[r346 旧 5 形] → 腿③新模式独担攻击 7/7 翻转不判', () => {
  const I = immortalInternals();
  const old = { INCIDENCE_CLAIM_EN: I.INCIDENCE_CLAIM_EN.slice(0, 5) };
  // 腿③由 r346 旧形承重的句（DET-2 旧 p3 proving…genuinely spreading、DET-3 旧
  // p2 on the rise 已在旧副词表）不在本注入翻转集
  const NEW_LEG3 = [DET_EN[0], DET_EN[3], DET_EN[4], ...HED_EN];
  assert.strictEqual(NEW_LEG3.length, 7);
  for (const s of NEW_LEG3) flip(hitI(s, old) === false, '删腿③新模式后仍命中: ' + s);
});
check('E 注入 EXEMPT_INC_EN=[r346 旧 8 形] → 新豁免独担良性 2/2 翻命中', () => {
  const I = immortalInternals();
  const old = { EXEMPT_INC_EN: I.EXEMPT_INC_EN.slice(0, 8) };
  const carried = [
    'Detection rates have risen and diagnosed cases have surged, and the disease seems to be spreading, but the true incidence remains unchanged.',
    'Screening has tripled the number of diagnosed cases and the disease appears to be spreading, though the actual incidence is stable.',
  ];
  for (const s of carried) {
    flip(hitI(s) === false, '置空前应被豁免: ' + s);
    flip(hitI(s, old) === true, '删新豁免后未翻命中: ' + s);
  }
});
check('E 注入 WIN_LEAD_EN=0 → 新族攻击 9/9 由判翻转不判（窗承重）', () => {
  for (const s of ATTACK_EN) flip(hitI(s, { WIN_LEAD_EN: 0 }) === false, '清零窗后仍命中: ' + s);
});
check('E 族独立性：DETECT_UP_EN=[] → r346 存量 EN 4/4 仍命中（LEAD_SCREEN 腿①不受波及）', () => {
  const R346_EN = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
  ];
  for (const s of R346_EN) flip(hitI(s, { DETECT_UP_EN: [] }) === true, '被 DETECT_UP_EN 注入误伤: ' + s);
});
check('E 族独立性：CASE_SURGE_EN/INCIDENCE_CLAIM_EN 旧形注入 → r346 存量 EN 4/4 仍命中', () => {
  const I = immortalInternals();
  const old = { CASE_SURGE_EN: I.CASE_SURGE_EN.slice(0, 7), INCIDENCE_CLAIM_EN: I.INCIDENCE_CLAIM_EN.slice(0, 5) };
  const R346_EN = [
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
  ];
  for (const s of R346_EN) flip(hitI(s, old) === true, '被旧形注入误伤: ' + s);
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hitI('Detection rates have risen and diagnosed cases tripled — is the disease really becoming more common?'), false, '疑问形未豁免');
});
check('F 边界锁：缺病例激增腿不判（检出能力变动 + 发生率结论）', () => {
  assert.strictEqual(hitI('Detection rates have risen, and the disease appears to be spreading.'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（检出能力变动 + 病例激增）', () => {
  assert.strictEqual(hitI('Detection rates have risen, and the number of diagnosed cases has surged.'), false, '缺腿③仍判');
});
check('F 边界锁：缺检出腿不判（病例激增 + 弱化结论——族外句按设计保留腿①门槛）', () => {
  assert.strictEqual(hitI('The number of diagnosed cases has surged, and the disease seems to be becoming more common.'), false, '缺腿①仍判');
});
check('F 边界锁：跨腿邻近窗（三腿相隔 >400 字符不判）', () => {
  const filler = 'This paragraph is an unrelated community-event planning note covering venue booking, table and chair counts, sound-system debugging, volunteer scheduling, weather and transit reminders, a two-week preparation window, budget and supply lists in an attached spreadsheet, meeting notices already sent by email, and any last-minute changes will be synced in the group chat. Thanks to everyone for cooperating, and we look forward to a successful event with good attendance and smooth on-site execution throughout the day.';
  const s = 'As detection rates have risen, ' + filler + ' the number of diagnosed cases has surged, and the incidence appears to be climbing.';
  assert.ok(s.length - s.indexOf('As detection rates') > 400, '样本跨度未超窗（样本构造失败）');
  assert.strictEqual(hitI(s), false, '跨腿窗失效');
});
check('F 边界锁：路径 (f) 过度诊断收益形不被路径 h 截胡', () => {
  const r = checkImmortalTimeBias('早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。');
  assert.ok(r.detail.includes('过度诊断×'), 'detail 应走路径 f: ' + r.detail);
});
check('F 边界锁：良性早期检出进展句不判（无发生率结论腿）', () => {
  assert.strictEqual(hitI('Early detection has improved and we now find many more tumors, which is a genuine advance in cancer care.'), false, '良性进展句被误判');
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
check('G __internals 暴露新常量且旧常量元素数只增不减', () => {
  const I = immortalInternals();
  assert.ok(Array.isArray(I.DETECT_UP_EN) && I.DETECT_UP_EN.length >= 5, 'DETECT_UP_EN 元素不足');
  assert.strictEqual(I.CASE_SURGE_EN.length, 12, 'CASE_SURGE_EN 应为 7+5');
  assert.strictEqual(I.INCIDENCE_CLAIM_EN.length, 10, 'INCIDENCE_CLAIM_EN 应为 5+5');
  assert.strictEqual(I.EXEMPT_INC_EN.length, 10, 'EXEMPT_INC_EN 应为 8+2');
  assert.strictEqual(I.CASE_SURGE_ZH.length, 1, 'CASE_SURGE_ZH 不应被改');
  assert.strictEqual(I.INCIDENCE_CLAIM_ZH.length, 7, 'INCIDENCE_CLAIM_ZH 不应被改');
  assert.strictEqual(I.EXEMPT_INC_ZH.length, 5, 'EXEMPT_INC_ZH 不应被改');
  assert.strictEqual(I.LEAD_SCREEN_ZH.length, 2, 'LEAD_SCREEN_ZH 不应被改');
  assert.strictEqual(I.LEAD_SCREEN_EN.length, 5, 'LEAD_SCREEN_EN 不应被改');
});

console.log(`\n负例注入汇总: ${flipCount}/${flipTotal} 个翻转断言全部翻转`);
console.log(`round-347 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
