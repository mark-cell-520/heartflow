'use strict';
/**
 * test/round-348-passive-detection-trending-incidence.test.js
 * [r348] 路径 (h) 第二措辞家族（真升级类型②：已有维度的全新措辞家族，维度
 * 计数 256 不变、src/index.js 零改动、VERSION 6.8.185 不 bump，同 r339–r347
 * 先例：族内补形不 bump）。
 *
 * r347 交接项①②落地（探针 coordination/agent4/probes/
 * r348-probe-candidates.js，集成树 v6.8.185 gate() 全量 findings 口径）：
 *   候选 A 检出腿被动/名词化形：攻击 10 条 7 条纯形穿透、良性 4/4 零误伤
 *     → 落地（3 条被 fallacy_of_relevance 代拦，不截胡纪律）；
 *   候选 B 腿③ trending 形：攻击 5 条 4 条穿透、良性 1 条非 pass 为既有
 *     mediator_confusion 基线（改动前后同判，非本轮新增）→ 落地；
 *   剩余穿透句 B-2（The number of detected tumors tripled…）无检出腿在
 *     场——路径 h 族语义要求检出混淆前提，按设计保留腿①门槛（即 r347 交
 *     接项③纯计数句），报告如实记录；
 *   C1 均值回归新形 2/5（ZH 单侧薄族）、C2 禀赋效应 5/5 但攻击形与良性
 *     教科书描述不可区分、C3 诉诸传统 0/3 已被代拦 → 均不立项。
 *
 * 补丁（src/immortal-time-bias.js，既有路径与常量零改动，只追加 + 主块
 * 接线第二族）：
 *   · 新增 DETECT_UP_ZH（腿①第三族：检查/检测的普及/铺开/推广，ZH 专项）
 *   · 新增 CASE_SURGE_ZH2（腿②第二族：病例浮出水面/带入视野）
 *   · 新增 CASE_SURGE_EN2（腿②第二族：case counts 复数形 / brought more
 *     cases to light / came to light / were caught / are now found）
 *   · 新增 INCIDENCE_CLAIM_ZH2（腿③第二族：攀升/飙升类动词 + 疾病侧
 *     「呈现上升趋势」尾形——探针校正：旧腿③表动词只有上升/升高/提高/
 *     上涨/增长/走高/变高，且「发病率呈现上升趋势」已被旧 pattern 1 的
 *     {0,10} gap 吸收，真缺口是攀升/飙升动词类）
 *   · 新增 INCIDENCE_CLAIM_EN2（腿③第二族：is trending upward / looks to
 *     be trending higher / on an upward trend / clearly trending more
 *     common）
 *   · 新增 EXEMPT_INC_ZH2 / EXEMPT_INC_EN2（第二豁免族：腿③ gap/hedge
 *     形的否定后置——发病率并没有攀升 / does not appear to be trending；
 *     negated claim 是正确判别动作不是攻击。has not climbed 类不设豁免：
 *     腿③各形都要求 is/are/appears 显式动词，无腿③即无命中，探针实证）
 *   · 路径 (h) 主块腿①三族取最早匹配、腿②/腿③两族取最早匹配，豁免判
 *     定取两族并集；__internals 登记 7 个新常量（负例注入口）
 *   · 族独立常量（*2 后缀）而非追加既有家族表：r347 轮测 G 段以精确
 *     equality 钉死 CASE_SURGE_EN/INCIDENCE_CLAIM_EN/ZH 元素数（12/10/
 *     1/7），追加会打破既有轮次断言——独立族零触碰存量测试（r338 先例）。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方语料全量）
 *   / D 存量回归 / E 常量级注入-删条承重（逐族 + 窗 + 族独立性）/ F 边界
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

// ─── 攻击集（A 被动/普及形 5EN+2ZH；B trending 结论形 4EN+2ZH）──────────
const A_EN = [
  'The wider adoption of CT screening has brought more cases to light, and the incidence is clearly rising.',
  'As screening programs expanded, many more cases came to light, proving the disease really is spreading.',
  'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
  'Increased uptake of screening has brought many more cases to light — the incidence is truly climbing.',
  'As screening became more widespread, many more tumors were caught, and the disease appears to be spreading.',
];
const A_ZH = [
  '筛查项目的铺开让大量潜伏病例浮出水面，可见这种疾病真的在蔓延。',
  '检查的普及使更多病例被及时发现，新发病例激增，足以证明患病率真的升高了。',
];
const B_EN = [
  'Diagnosed cases have surged since screening began, so the incidence is trending upward.',
  'Case counts jumped after the screening program, suggesting the illness is on an upward trend.',
  'Screening surfaced far more cancers, and the incidence seems to be trending up sharply.',
  'With so many more cases detected, the disease is clearly trending more common.',
];
const B_ZH = [
  '筛查普及后确诊人数激增，发病率不断攀升。',
  '体检普及之后确诊病例激增，患病率持续飙升。',
  '普筛上线后新发病例翻倍，这种病呈现出上升趋势。',
];
const ATTACK = [...A_EN, ...A_ZH, ...B_EN, ...B_ZH];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：路径 h 第二族攻击 14/14 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：A 族 EN 5/5 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of A_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});
check('B 模块直调：A 族 ZH 2/2 命中且 detail 带过度诊断发生率误读标', () => {
  for (const s of A_ZH) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('过度诊断发生率误读'), 'detail 缺标: ' + r.detail);
  }
});
check('B 模块直调：B 族 EN 4/4 + ZH 3/3 命中且 detail 标正确', () => {
  for (const s of B_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, 'EN 未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'EN detail 缺标: ' + r.detail);
  }
  for (const s of B_ZH) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, 'ZH 未命中: ' + s);
    assert.ok(r.detail.includes('过度诊断发生率误读'), 'ZH detail 缺标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // A 族良性孪生（谨慎解读/真实率未变）
  'The wider adoption of screening has brought more cases to light, but the true incidence may be unchanged.',
  'With broader coverage, more cases are found, though the underlying rate appears stable.',
  'More cases surfaced after the rollout, yet the real incidence seems stable once ascertainment is accounted for.',
  '筛查覆盖面扩大让更多病例被检出，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '检查的普及让更多病例被及时发现，这反映的是检出提前，并不代表发病率真的上升。',
  '筛查项目铺开让病例浮出水面，但真实发病率可能并没有变化。',
  // B 族良性（trending 形 + 检出解释/谨慎解读 + 否定后置豁免族）
  'Reported cases surged, though the true rate seems stable rather than trending higher.',
  '筛查普及后新发病例激增，发病率呈现上升趋势，但这主要是检出率提高造成的。',
  '体检普及之后确诊病例激增，患病率步入上升通道，但这主要是检出提前造成的。',
  // 否定后置形（EXEMPT_INC_*2 承重——negated claim 是正确判别动作）
  '筛查普及后确诊人数激增，但发病率并没有攀升。',
  'Screening tripled diagnosed cases, but the incidence does not appear to be trending upward.',
  'Case counts jumped after screening, yet the incidence has not climbed.',
];
check('C 良性零误伤：路径 h 第二族手工良性 12/12 模块级不判', () => {
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
check('D 存量回归：既有路径 h 常量元素数与窗值不变（族独立常量零触碰）', () => {
  const I = immortalInternals();
  assert.strictEqual(I.CASE_SURGE_EN.length, 12, 'CASE_SURGE_EN 应保持 12');
  assert.strictEqual(I.INCIDENCE_CLAIM_EN.length, 10, 'INCIDENCE_CLAIM_EN 应保持 10');
  assert.strictEqual(I.EXEMPT_INC_EN.length, 10, 'EXEMPT_INC_EN 应保持 10');
  assert.strictEqual(I.CASE_SURGE_ZH.length, 1, 'CASE_SURGE_ZH 应保持 1');
  assert.strictEqual(I.INCIDENCE_CLAIM_ZH.length, 7, 'INCIDENCE_CLAIM_ZH 应保持 7');
  assert.strictEqual(I.EXEMPT_INC_ZH.length, 5, 'EXEMPT_INC_ZH 应保持 5');
  assert.strictEqual(I.DETECT_UP_EN.length, 5, 'DETECT_UP_EN 应保持 5');
  assert.strictEqual(I.LEAD_SCREEN_ZH.length, 2, 'LEAD_SCREEN_ZH 不应被改');
  assert.strictEqual(I.LEAD_SCREEN_EN.length, 5, 'LEAD_SCREEN_EN 不应被改');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
let flipCount = 0, flipTotal = 0;
const flip = (cond, msg) => { flipTotal++; if (cond) flipCount++; else throw new Error(msg); };
check('E 注入 DETECT_UP_ZH=[] → A-ZH 腿①独担句 1/1 翻转不判', () => {
  flip(hitI(A_ZH[1], { DETECT_UP_ZH: [] }) === false, '删 DETECT_UP_ZH 后仍命中: ' + A_ZH[1]);
});
check('E 注入 CASE_SURGE_ZH2=[] → A-ZH 腿②独担句 1/1 翻转不判', () => {
  flip(hitI(A_ZH[0], { CASE_SURGE_ZH2: [] }) === false, '删 CASE_SURGE_ZH2 后仍命中: ' + A_ZH[0]);
});
check('E 注入 CASE_SURGE_EN2=[] → 腿②新模式独担攻击 6/6 翻转不判', () => {
  for (const s of [...A_EN, B_EN[1]]) flip(hitI(s, { CASE_SURGE_EN2: [] }) === false, '删 CASE_SURGE_EN2 后仍命中: ' + s);
});
check('E 注入 INCIDENCE_CLAIM_EN2=[] → 腿③新模式独担攻击 4/4 翻转不判', () => {
  for (const s of B_EN) flip(hitI(s, { INCIDENCE_CLAIM_EN2: [] }) === false, '删 INCIDENCE_CLAIM_EN2 后仍命中: ' + s);
});
check('E 注入 INCIDENCE_CLAIM_ZH2=[] → 腿③新模式独担攻击 ZH 3/3 翻转不判', () => {
  for (const s of B_ZH) flip(hitI(s, { INCIDENCE_CLAIM_ZH2: [] }) === false, '删 INCIDENCE_CLAIM_ZH2 后仍命中: ' + s);
});
check('E 注入 EXEMPT_INC_ZH2=[] → 否定后置良性 ZH 1/1 翻命中', () => {
  const s = '筛查普及后确诊人数激增，但发病率并没有攀升。';
  flip(hitI(s) === false, '置空前应被豁免: ' + s);
  flip(hitI(s, { EXEMPT_INC_ZH2: [] }) === true, '删 EXEMPT_INC_ZH2 后未翻命中: ' + s);
});
check('E 注入 EXEMPT_INC_EN2=[] → 否定后置良性 EN 1/1 翻命中', () => {
  const s = 'Screening tripled diagnosed cases, but the incidence does not appear to be trending upward.';
  flip(hitI(s) === false, '置空前应被豁免: ' + s);
  flip(hitI(s, { EXEMPT_INC_EN2: [] }) === true, '删 EXEMPT_INC_EN2 后未翻命中: ' + s);
});
check('E 注入 WIN_LEAD_EN=0 / WIN_LEAD_ZH=0 → 新族攻击 EN 9 + ZH 5 全部翻转不判（窗承重）', () => {
  for (const s of [...A_EN, ...B_EN]) flip(hitI(s, { WIN_LEAD_EN: 0 }) === false, '清零 EN 窗后仍命中: ' + s);
  for (const s of [...A_ZH, ...B_ZH]) flip(hitI(s, { WIN_LEAD_ZH: 0 }) === false, '清零 ZH 窗后仍命中: ' + s);
});
check('E 族独立性：七个新常量全置空 → r346/r347 存量攻击 17/17 仍命中', () => {
  const empty = { DETECT_UP_ZH: [], CASE_SURGE_ZH2: [], CASE_SURGE_EN2: [], INCIDENCE_CLAIM_ZH2: [], INCIDENCE_CLAIM_EN2: [], EXEMPT_INC_ZH2: [], EXEMPT_INC_EN2: [] };
  const R346 = [
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
    '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
    '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
  ];
  const R347 = [
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
    'New imaging technology detects far more tumors, and the incidence appears to be climbing.',
    'Detection rates have risen, the number of diagnosed cases has surged, and the cancer is clearly on the rise.',
    'Diagnosed cases tripled after the screening program, and the disease seems to be becoming more common.',
    'Screening surfaced far more tumors, and the incidence looks to be rising.',
    'With so many more cases detected, the disease appears to be spreading.',
    'Since screening expanded, far more cases have been detected, and the incidence appears to be climbing.',
  ];
  for (const s of [...R346, ...R347]) flip(hitI(s, empty) === true, '被新族置空误伤: ' + s);
});
check('E 族独立性：CASE_SURGE_EN2=[] → r347 腿②既有形承重句仍命中', () => {
  const stock = [
    'Diagnosed cases tripled after the screening program, and the disease seems to be becoming more common.',
    'With so many more cases detected, the disease appears to be spreading.',
    'Since screening expanded, far more cases have been detected, and the incidence appears to be climbing.',
  ];
  for (const s of stock) flip(hitI(s, { CASE_SURGE_EN2: [] }) === true, '被 CASE_SURGE_EN2 置空误伤: ' + s);
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hitI('Case counts jumped after screening — is the illness really on an upward trend?'), false, '疑问形未豁免');
});
check('F 边界锁：缺病例激增腿不判（检出普及 + trending 结论）', () => {
  assert.strictEqual(hitI('As screening became more widespread, the disease appears to be trending more common.'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（检出普及 + 被动浮现）', () => {
  assert.strictEqual(hitI('The wider adoption of CT screening has brought more cases to light.'), false, '缺腿③仍判');
});
check('F 边界锁：缺检出腿不判（纯计数 + trending 结论——r347 交接项③按设计保留腿①门槛）', () => {
  assert.strictEqual(hitI('The number of detected tumors tripled, and the disease looks to be trending higher.'), false, '缺腿①仍判');
});
check('F 边界锁：跨腿邻近窗（三腿相隔 >400 字符不判）', () => {
  const filler = 'This paragraph is an unrelated community-event planning note covering venue booking, table and chair counts, sound-system debugging, volunteer scheduling, weather and transit reminders, a two-week preparation window, budget and supply lists in an attached spreadsheet, meeting notices already sent by email, and any last-minute changes will be synced in the group chat. Thanks to everyone for cooperating, and we look forward to a successful event with good attendance and smooth on-site execution throughout the day.';
  const s = 'As screening programs expanded, ' + filler + ' many more cases came to light, proving the disease really is spreading.';
  assert.ok(s.length - s.indexOf('As screening programs expanded') > 400, '样本跨度未超窗（样本构造失败）');
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
check('G __internals 暴露 7 个新族常量且元素数符合登记', () => {
  const I = immortalInternals();
  assert.ok(Array.isArray(I.DETECT_UP_ZH) && I.DETECT_UP_ZH.length === 2, 'DETECT_UP_ZH 应为 2 形');
  assert.ok(Array.isArray(I.CASE_SURGE_ZH2) && I.CASE_SURGE_ZH2.length === 1, 'CASE_SURGE_ZH2 应为 1 形');
  assert.ok(Array.isArray(I.CASE_SURGE_EN2) && I.CASE_SURGE_EN2.length === 5, 'CASE_SURGE_EN2 应为 5 形');
  assert.ok(Array.isArray(I.INCIDENCE_CLAIM_ZH2) && I.INCIDENCE_CLAIM_ZH2.length === 2, 'INCIDENCE_CLAIM_ZH2 应为 2 形');
  assert.ok(Array.isArray(I.INCIDENCE_CLAIM_EN2) && I.INCIDENCE_CLAIM_EN2.length === 5, 'INCIDENCE_CLAIM_EN2 应为 5 形');
  assert.ok(Array.isArray(I.EXEMPT_INC_ZH2) && I.EXEMPT_INC_ZH2.length === 1, 'EXEMPT_INC_ZH2 应为 1 形');
  assert.ok(Array.isArray(I.EXEMPT_INC_EN2) && I.EXEMPT_INC_EN2.length === 1, 'EXEMPT_INC_EN2 应为 1 形');
});

console.log(`\n负例注入汇总: ${flipCount}/${flipTotal} 个翻转断言全部翻转`);
console.log(`round-348 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
