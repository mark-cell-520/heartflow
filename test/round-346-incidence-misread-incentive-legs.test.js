'use strict';
/**
 * test/round-346-incidence-misread-incentive-legs.test.js
 * [r346] 双族落地（真升级类型②：已有维度的全新措辞家族，维度计数 256
 * 不变、src/index.js 零改动、VERSION 6.8.185 不变，同 r339–r345 先例）。
 *
 * 族 1（候选 A，r342 申报、r343/r345 两度延期后落地）：
 *   immortal_time_bias 路径 (h) 过度诊断发生率误读（overdiagnosis
 *   incidence misread）。筛查普及使更多（含惰性/本不会发病）病灶被检出，
 *   病例计数上升是检出动作的结果，把「确诊人数翻倍」当作「发病率真的在
 *   上升/疾病真的在蔓延」是用检出计数冒充流行病学发生率。既有路径均不
 *   触及该推论腿：lead_time(路径 d) 判确诊时点前移、length_time(路径 e)
 *   判病例构成偏慢病程、overdiagnosis(路径 f) 判本不会发病病灶计入收益。
 *   立项探针（coordination/agent4/probes/r346-probe-candidates.js，集成
 *   树 v6.8.185 gate() 全量 findings 口径）：A 攻击 13 条中纯形 2 条完全
 *   穿引擎、其余 11 条被 reverse_causation/pseudo_causal 泛维度代拦（不
 *   截胡纪律：代拦者存在，本路径只补纯形缺口）；良性 8 条 FP 1（既有
 *   vagueness 基线，非本路径新增）。
 *   补丁（src/immortal-time-bias.js，既有路径与常量零改动）：
 *     · 新增 CASE_SURGE_ZH/EN（腿② 检出病例数激增）、INCIDENCE_CLAIM_ZH/EN
 *       （腿③ 发生率/蔓延结论）、EXEMPT_INC_ZH/EN（豁免五通路：谨慎解读
 *       否定 / 否定后置 / 检出解释（谨慎标记前置防呆）/ 过度诊断点名带纠正
 *       语境 / 死亡率终点设计）+ 路径 (h) 三腿共现块（复用 WIN_LEAD 跨腿
 *       窗与 LEAD_SCREEN 筛查域腿①——LEAD_SCREEN_ZH 补「体检普及」，疑问形
 *       守卫同路径 d/e/f/g）。
 *
 * 族 2（r345 交接项落地）：incentive_conflation 补腿——
 *     · MIRROR_ATTR_ZH_F 归因连接词变体族（三分支：(a) 副词必需的问题/
 *       根源/症结…就出在参保后；(b) 新定位名词（根本原因/核心问题/真正
 *       原因/缘由/由头）× 裸介词/是；(c) 既有定位名词 × 裸「是」）
 *     · MIRROR_DENIAL_ZH_E dismiss 口语尾族（忽略就行/不用理会/不足挂齿/
 *       无关痛痒/不必放在心上/不提也罢…）
 *     · MIRROR_DENIAL_ZH_A 尾窗补「什么」（没什么关系/没什么相干）
 *     · EN「comes down to 后超 40 字符才出现行为域词」经 gate 层实测已被
 *       mediator_confusion 代拦（不截胡纪律），本轮不补 EN 腿。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方语料全量）
 *   / D 存量回归 / E 常量级注入-删条承重（逐腿 + 窗 + 豁免 + 元素隔离 +
 *   族独立性）/ F 边界锁 / G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { checkImmortalTimeBias, __internals: immortalInternals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const { detectIncentiveConflation, detectIncentiveBlindSpot, __internals } = require(path.join(ROOT, 'src', 'incentive-blind-spot.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const hitI = (t, inj) => checkImmortalTimeBias(t, inj).hit === true;
const hitC = (t, inj) => detectIncentiveConflation(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击集 ──────────────────────────────────────────────────────────
// 路径 (h) 筛查过度诊断发生率误读（ZH 8 + EN 7，覆盖肿瘤/普筛/体检/早筛
// × 翻倍/激增/攀升/tripled/surged/multiplied × 发病率上升/疾病蔓延/
// 患病的人越来越多）
const INC_ZH = [
  '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
  '普筛出大量本来一辈子都不会发病的病变，病例数因此激增，可见这种病真的在蔓延。',
  '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
  '早筛查出一批终生不会恶变的肿瘤，新增病例大幅增加，说明患这种癌的人越来越多了。',
  '自从开展全员癌症早筛以来，确诊人数一年内翻了好几倍，看来这种病的发病率真的在快速上升。',
  '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
  '推行筛查之后，查出的病例比以前多了好几倍，可见这种疾病确实越来越多。',
  '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
];
const INC_EN = [
  'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
  'The screening program surfaced hundreds of cases that would never have progressed, and the case count surge proves the disease is spreading.',
  'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
  'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
  'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
  'Population-wide early detection has doubled the number of reported cases in five years, suggesting the illness is becoming more prevalent.',
  'Screening detected far more tumors this decade, and more people are being diagnosed with the disease every year.',
];
// incentive_conflation 补腿：F 连接词 6 + E 尾族 6
const CONF_ZH = [
  '问题就出在参保后的生活习惯上，跟参保前的健康底子没什么关系。',
  '理赔上升的根源其实在于参保后的放纵行为，投保前的身体底子不足挂齿。',
  '症结在于参保后的行为变化，参保前的风险构成完全无关紧要。',
  '赔付上升的根本原因在于参保后的疏于管理，投保前的风险构成大可不管。',
  '理赔金额上涨的缘由是参保后的过度诊疗，投保前的风险结构忽略就行。',
  '理赔上升的真正原因出在参保后的松懈管理，参保前的人群健康不提也罢。',
  '投保前的风险结构忽略就行，关键是参保后大家更舍得花钱了。',
  '参保前的人群健康不提也罢，理赔上升说到底在于参保后的行为。',
  '理赔上升全部来自参保后的过度就医，投保前的风险构成大可不管。',
  '赔付激增，关键在于参保后的松懈管理，参保时的健康底子无关痛痒。',
  '医疗费用激增，说到底在于参保后的过度检查，投保时的健康池构成不必放在心上。',
  '理赔金额上升，问题出在参保后的生活习惯，投保前的身体底子不用放在心上。',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：路径 h 攻击 15/15 → immortal_time_bias findings 且 action≠pass', () => {
  for (const s of [...INC_ZH, ...INC_EN]) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：incentive 补腿攻击 12/12 → incentive_blind_spot findings', () => {
  for (const s of CONF_ZH) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'incentive_blind_spot');
    assert.ok(f, 'findings 缺 incentive_blind_spot: ' + s);
  }
});
check('A gate 层归因：合并入口 incentive_conflation 子族承重 12/12', () => {
  for (const s of CONF_ZH) {
    const r = detectIncentiveBlindSpot(s);
    assert.strictEqual(r.dimension, 'incentive_conflation', '归因非 incentive_conflation: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：路径 h ZH 8/8 命中且 detail 带过度诊断发生率误读标', () => {
  for (const s of INC_ZH) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('过度诊断发生率误读'), 'detail 缺标: ' + r.detail);
  }
});
check('B 模块直调：路径 h EN 7/7 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of INC_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});
check('B 模块直调：incentive 补腿 12/12 命中', () => {
  for (const s of CONF_ZH) assert.strictEqual(hitC(s), true, '未命中: ' + s);
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN_INC = [
  '筛查推广后确诊人数上升了，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '开展早筛后确诊人数增多是预期内的，后续随访方案已经跟上。',
  'Screening increased the number of detected cases, but this does not mean the disease is becoming more common.',
  '病例数上升不等于患病率上升，确诊人数受筛查普及度影响，需用总死亡率核对。',
  '早筛提高了检出率，但流行病学家提醒这并不代表疾病真的在增多。',
  'Screening increases detected cases, but researchers caution this does not mean the true incidence is rising.',
  '筛查让更多早期病例被发现，但这可能是检出提前，不能直接说明发病率真的上升。',
  'A surge in diagnosed cases may reflect better detection rather than a real increase in disease frequency.',
];
check('C 良性零误伤：路径 h 手工良性 8/8 模块级不判', () => {
  for (const s of BENIGN_INC) assert.strictEqual(hitI(s), false, '误判: ' + s);
});
const BENIGN_CONF = [
  '赔付上升可能同时来自参保后行为变化与参保前风险构成，需要分别识别。',
  '既要看参保后的就医行为，也要看参保前的风险分布，不能只归因一方。',
  '问题出在参保后的健康管理跟不上，需要加强随访而不是提高参保门槛。',
  '制度问题的根源在于监管缺位，与参保人群的风险构成无关。',
  '关键不在于参保后的行为，而在于参保前的风险构成差异。',
  'Rising claims may reflect both post-enrollment behavior and pre-existing risk composition.',
  'Attribution must separate moral hazard from adverse selection; neither alone explains the rise.',
  '问题就出在参保后的生活习惯，但这不是说参保前的健康底子没什么关系。', // 翻转守卫
];
check('C 良性零误伤：incentive 补腿手工良性 8/8 模块级不判', () => {
  for (const s of BENIGN_CONF) assert.strictEqual(hitC(s), false, '误伤: ' + s);
});
check('C 良性零误伤：官方四基准语料全量模块级两族零命中', () => {
  function flatten(mod) {
    const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
    if (Array.isArray(src)) out.push(...src);
    else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
    return out.filter(s => typeof s === 'string');
  }
  let n = 0, fpI = 0, fpC = 0; const hitsI = [], hitsC = [];
  for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
    for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
      n++;
      const rI = checkImmortalTimeBias(s);
      if (rI.hit && (rI.detail.includes('过度诊断发生率误读') || rI.detail.includes('overdiagnosis-incidence'))) { fpI++; hitsI.push(s.slice(0, 60)); }
      if (detectIncentiveConflation(s).hit) { fpC++; hitsC.push(s.slice(0, 60)); }
    }
  }
  assert.ok(n >= 360, '语料条数不足: ' + n);
  assert.strictEqual(fpI, 0, '路径 h 误伤 ' + fpI + ' 条: ' + hitsI.join(' | '));
  assert.strictEqual(fpC, 0, 'incentive 误伤 ' + fpC + ' 条: ' + hitsC.join(' | '));
});

// ─── D. 存量回归 ──────────────────────────────────────────────────
check('D 存量回归：路径 (d) lead-time 攻击仍命中且 EXEMPT_LEAD 仍三元素', () => {
  const r = checkImmortalTimeBias('肿瘤早筛让确诊时间平均提前了两年，患者的五年生存率因此大幅上升，可见筛查显著延长了寿命。');
  assert.strictEqual(r.hit, true);
  assert.ok(r.detail.includes('领先时间偏误'), '路径 d 回归: ' + r.detail);
  const I = immortalInternals();
  assert.strictEqual(I.EXEMPT_LEAD_ZH.length, 3, 'EXEMPT_LEAD_ZH 元素数被改');
  assert.strictEqual(I.EXEMPT_LEAD_EN.length, 3, 'EXEMPT_LEAD_EN 元素数被改');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});
check('D 存量回归：路径 (a)(e)(f)(g) 攻击仍命中', () => {
  assert.ok(checkImmortalTimeBias('治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。').hit, '路径 a 回归');
  assert.ok(checkImmortalTimeBias('筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，这说明筛查确实有效。').detail.includes('病程长度偏误'), '路径 e 回归');
  assert.ok(checkImmortalTimeBias('早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。').detail.includes('过度诊断'), '路径 f 回归');
  assert.ok(checkImmortalTimeBias('新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后。').detail.includes('Will Rogers'), '路径 g 回归');
});
check('D 存量回归：r343 参保前归因 4/4、r344 镜像 4/4 仍判', () => {
  const R343 = [
    '保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。',
    '赔付率变高证明来投保的本就是体弱多病的人，道德风险根本不存在。',
    'Rising insurance claims prove the insured were already sicker; how they behave after enrolling is irrelevant.',
    'Higher payout rates show adverse selection alone; moral hazard plays no role at all.',
  ];
  const R344 = [
    '理赔上升全是道德风险造成的，跟投保前的风险构成没有任何关系。',
    'The payout spike is entirely a post-enrollment behavior story; adverse selection plays no role whatsoever.',
    'Cost growth is only about post-insurance conduct; the pre-enrollment health pool can be ignored.',
    'Higher claims are solely due to careless behavior after signing up — who signed up in the first place makes no difference.',
  ];
  for (const s of R343) {
    assert.strictEqual(hitC(s), true, 'r343 方向回归失效: ' + s);
    assert.strictEqual(detectIncentiveBlindSpot(s).dimension, 'incentive_conflation', 'r343 归因被截胡: ' + s);
  }
  for (const s of R344) assert.strictEqual(hitC(s), true, 'r344 方向回归失效: ' + s);
});
check('D 存量回归：r345 E 连接词组独担样本仍判（ZH_E 不受 F 组影响）', () => {
  const R345 = [
    '赔付率走高的问题出在参保后的生活习惯，参保前的健康结构无关紧要。',
    '医疗费用激增，根源在于参保后的放纵行为，投保时的健康池构成可以忽略。',
    '赔付增加关键在于参保后的过度就医，跟投保前的风险构成没有任何关系。',
  ];
  for (const s of R345) assert.strictEqual(hitC(s), true, 'r345 E 组回归失效: ' + s);
});
check('D 存量回归：GROUPS 组计数终态（ZH 腿① 6 / EN 腿① 4 / ZH 腿② 5 / EN 腿② 6）', () => {
  const I = __internals();
  assert.strictEqual(I.MIRROR_ATTR_ZH_GROUPS.length, 6, 'MIRROR_ATTR_ZH_GROUPS');
  assert.strictEqual(I.MIRROR_ATTR_EN_GROUPS.length, 4, 'MIRROR_ATTR_EN_GROUPS');
  assert.strictEqual(I.MIRROR_DENIAL_ZH_GROUPS.length, 5, 'MIRROR_DENIAL_ZH_GROUPS');
  assert.strictEqual(I.MIRROR_DENIAL_EN_GROUPS.length, 6, 'MIRROR_DENIAL_EN_GROUPS');
  const names = g => g.map(x => x[0]);
  assert.ok(names(I.MIRROR_ATTR_ZH_GROUPS).includes('MIRROR_ATTR_ZH_F'), 'ZH 腿① GROUPS 缺 F 组');
  assert.ok(names(I.MIRROR_DENIAL_ZH_GROUPS).includes('MIRROR_DENIAL_ZH_E'), 'ZH 腿② GROUPS 缺 E 组');
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
// 路径 h 逐腿
check('E 注入 CASE_SURGE_ZH=[] → 路径 h ZH 8/8 由判翻转不判', () => {
  for (const s of INC_ZH) assert.strictEqual(hitI(s, { CASE_SURGE_ZH: [] }), false, '删腿②后仍命中: ' + s);
});
check('E 注入 CASE_SURGE_EN=[] → 路径 h EN 7/7 由判翻转不判', () => {
  for (const s of INC_EN) assert.strictEqual(hitI(s, { CASE_SURGE_EN: [] }), false, '删腿②后仍命中: ' + s);
});
check('E 注入 INCIDENCE_CLAIM_ZH=[] → 路径 h ZH 8/8 由判翻转不判', () => {
  for (const s of INC_ZH) assert.strictEqual(hitI(s, { INCIDENCE_CLAIM_ZH: [] }), false, '删腿③后仍命中: ' + s);
});
check('E 注入 INCIDENCE_CLAIM_EN=[] → 路径 h EN 7/7 由判翻转不判', () => {
  for (const s of INC_EN) assert.strictEqual(hitI(s, { INCIDENCE_CLAIM_EN: [] }), false, '删腿③后仍命中: ' + s);
});
check('E 注入 LEAD_SCREEN_ZH=[] → 路径 h ZH 8/8 由判翻转不判', () => {
  for (const s of INC_ZH) assert.strictEqual(hitI(s, { LEAD_SCREEN_ZH: [] }), false, '删腿①后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_ZH=0 / WIN_LEAD_EN=0 → 路径 h 攻击由判翻转不判', () => {
  for (const s of INC_ZH) assert.strictEqual(hitI(s, { WIN_LEAD_ZH: 0 }), false, '清零窗后仍命中: ' + s);
  for (const s of INC_EN) assert.strictEqual(hitI(s, { WIN_LEAD_EN: 0 }), false, '清零窗后仍命中: ' + s);
});
// 路径 h 豁免整表 + 元素隔离（探针句三腿齐全，豁免标记在攻击形之后）
const EXEMPT_INC_PROBES = [
  ['EXEMPT_INC_ZH/谨慎否定', 'EXEMPT_INC_ZH', '癌症筛查普及后新确诊的病例数成倍增长，但这并不代表发病率真的在上升。'],
  ['EXEMPT_INC_ZH/否定后置', 'EXEMPT_INC_ZH', '普筛后病例数激增，发病率上升了，可这并不代表什么。'],
  ['EXEMPT_INC_ZH/检出解释', 'EXEMPT_INC_ZH', '普筛后确诊人数激增，说明发病率在上升——但这主要是过去漏诊被及时发现带来的。'],
  ['EXEMPT_INC_EN/does-not-mean', 'EXEMPT_INC_EN', 'Screening has tripled the number of diagnosed cases, but this does not mean the incidence of the disease is really rising.'],
  ['EXEMPT_INC_EN/better-detection', 'EXEMPT_INC_EN', 'Screening tripled diagnosed cases, so the incidence is rising — but that is better detection rather than a real increase.'],
  ['EXEMPT_INC_EN/死亡率终点', 'EXEMPT_INC_EN', 'Screening tripled the number of diagnosed cases, which shows the incidence is rising, but the trial used overall mortality as the primary endpoint and found no difference.'],
];
for (const [name, key, text] of EXEMPT_INC_PROBES) {
  check(`E 注入 ${key}=[] → ${name} 由豁免翻转命中`, () => {
    const before = checkImmortalTimeBias(text);
    assert.strictEqual(before.hit, false, '置空前应被豁免，实际 hit=' + before.hit);
    assert.strictEqual(hitI(text, { [key]: [] }), true, '置空后应命中');
  });
}
check('E 注入 EXEMPT_INC_ZH=[仅谨慎否定] → 否定后置句与检出解释句翻命中、谨慎否定句仍豁免', () => {
  const I = immortalInternals();
  const only0 = { EXEMPT_INC_ZH: [I.EXEMPT_INC_ZH[0]] };
  assert.strictEqual(hitI('癌症筛查普及后新确诊的病例数成倍增长，但这并不代表发病率真的在上升。', only0), false, '谨慎否定句应仍豁免');
  assert.strictEqual(hitI('普筛后病例数激增，发病率上升了，可这并不代表什么。', only0), true, '否定后置句未被隔离');
  assert.strictEqual(hitI('普筛后确诊人数激增，说明发病率在上升——但这主要是过去漏诊被及时发现带来的。', only0), true, '检出解释句未被隔离');
});
check('E 注入 EXEMPT_INC_EN=[仅 better-detection] → does-not-mean 句翻命中、better-detection 句仍豁免', () => {
  const I = immortalInternals();
  const only3 = { EXEMPT_INC_EN: [I.EXEMPT_INC_EN[3]] };
  assert.strictEqual(hitI('Screening has tripled the number of diagnosed cases, but this does not mean the incidence of the disease is really rising.', only3), true, 'does-not-mean 句未被隔离');
  assert.strictEqual(hitI('Screening tripled diagnosed cases, so the incidence is rising — but that is better detection rather than a real increase.', only3), false, 'better-detection 句应仍豁免');
});
// incentive 补腿逐组
check('E 注入 MIRROR_ATTR_ZH_F=[] → F 连接词独担样本 6/6 失效', () => {
  for (const s of CONF_ZH.slice(0, 6)) assert.strictEqual(hitC(s, { MIRROR_ATTR_ZH_F: [] }), false, '删 F 组后仍命中: ' + s);
});
check('E 注入 MIRROR_DENIAL_ZH_E=[] → E 尾族独担样本 6/6 失效', () => {
  for (const s of CONF_ZH.slice(6)) assert.strictEqual(hitC(s, { MIRROR_DENIAL_ZH_E: [] }), false, '删 E 组后仍命中: ' + s);
});
check('E 注入 MIRROR_DENIAL_ZH_A=[] → 「什么」尾族独担样本失效', () => {
  const s = '问题就出在参保后的生活习惯上，跟参保前的健康底子没什么关系。';
  assert.strictEqual(hitC(s), true);
  assert.strictEqual(hitC(s, { MIRROR_DENIAL_ZH_A: [] }), false, '删 ZH_A 后仍命中');
});
check('E 注入 MIRROR_ATTR_ZH_E=[] → F 组样本不受影响（组间隔离）', () => {
  for (const s of CONF_ZH.slice(0, 6)) assert.strictEqual(hitC(s, { MIRROR_ATTR_ZH_E: [] }), true, 'F 样本被 ZH_E 注入误伤: ' + s);
});
check('E 注入 MIRROR_ATTR_ZH_E=[] → ZH_E 承重样本由判翻转不判（隔离反向证明）', () => {
  const ZH_E_CARRIED = CONF_ZH.slice(6).filter(s => /说到底在于|问题出在|关键在于/.test(s));
  assert.ok(ZH_E_CARRIED.length >= 3, 'ZH_E 承重样本不足: ' + ZH_E_CARRIED.length);
  for (const s of ZH_E_CARRIED) assert.strictEqual(hitC(s, { MIRROR_ATTR_ZH_E: [] }), false, '删 ZH_E 后仍命中: ' + s);
});
check('E 注入 MIRROR_ATTR_ZH=[] / MIRROR_DENIAL_ZH=[] → 中文攻击全失效', () => {
  for (const s of CONF_ZH) {
    assert.strictEqual(hitC(s, { MIRROR_ATTR_ZH: [] }), false, '删腿①后仍命中: ' + s);
    assert.strictEqual(hitC(s, { MIRROR_DENIAL_ZH: [] }), false, '删腿②后仍命中: ' + s);
  }
});
check('E 注入 PAIR_ZH=-1 → 中文攻击全失效', () => {
  for (const s of CONF_ZH) assert.strictEqual(hitC(s, { PAIR_ZH: -1 }), false, '删窗后仍命中: ' + s);
});
const FALSE = /(?!)/;
check('E 注入 CONFLATION_CORRECT_ZH 永假 → 两者并重良性变红', () => {
  const s = '赔付上升可能同时来自两种机制，不能把全部归因于参保后：问题就出在参保后的生活习惯上，跟参保前的健康底子没什么关系。';
  assert.strictEqual(hitC(s), false);
  assert.strictEqual(hitC(s, { CONFLATION_CORRECT_ZH: FALSE }), true);
});
check('E 注入 ANTIDOTE_ZH 永假 → 防范表述+补腿攻击结构良性变红', () => {
  const s = '防范逆选择很重要：问题就出在参保后的生活习惯上，参保前的健康底子忽略就行。';
  assert.strictEqual(hitC(s), false);
  assert.strictEqual(hitC(s, { ANTIDOTE_ZH: FALSE }), true);
});
check('E 族独立性：八张腿组表全清 → incentive 攻击 12/12 失效', () => {
  const inj = {
    ADV_ATTR_ZH: [], ADV_ATTR_EN: [], MORAL_DENIAL_ZH: [], MORAL_DENIAL_EN: [],
    MIRROR_ATTR_ZH: [], MIRROR_ATTR_EN: [], MIRROR_DENIAL_ZH: [], MIRROR_DENIAL_EN: [],
  };
  for (const s of CONF_ZH) assert.strictEqual(hitC(s, inj), false, '清空后仍命中: ' + s);
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：路径 h 疑问形不判', () => {
  assert.strictEqual(hitI('癌症筛查让新确诊的病例数成倍增长，这表明发病率真的在上升吗？'), false, '疑问形未豁免');
});
check('F 边界锁：缺病例激增腿不判（筛查域 + 发生率结论）', () => {
  assert.strictEqual(hitI('癌症筛查普及了，这说明发病率真的在上升。'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（筛查域 + 病例激增）', () => {
  assert.strictEqual(hitI('癌症筛查让每年新确诊的病例数成倍增长。'), false, '缺腿③仍判');
});
check('F 边界锁：缺筛查域腿不判（病例激增 + 发生率结论）', () => {
  assert.strictEqual(hitI('新确诊的病例数成倍增长，这表明发病率真的在上升。'), false, '缺腿①仍判');
});
check('F 边界锁：跨腿邻近窗（三腿相隔 >160 字不判）', () => {
  const filler = '这是一段与流行病学统计无关的社区活动筹备说明，讲的是场地预订、桌椅数量、音响设备调试和志愿者排班流程，组织者还提醒大家关注天气预报与交通路线，整个筹备过程预计需要两周时间，相关预算与物资清单另见附件表格，会议通知已通过邮件发送给各位成员，如有变动将第一时间在群里同步更新，谢谢大家的配合与支持，期待本次活动顺利举办并取得良好效果。';
  const s = '癌症筛查推广之后，' + filler + '新确诊的病例数成倍增长，这表明发病率真的在上升。';
  assert.ok(s.indexOf('成倍增长') - s.indexOf('癌症筛查') > 160, '样本跨度未超窗（样本构造失败）');
  assert.strictEqual(hitI(s), false, '跨腿窗失效');
});
check('F 边界锁：路径 (f) 过度诊断收益形不被路径 h 截胡', () => {
  const r = checkImmortalTimeBias('早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。');
  assert.ok(r.detail.includes('过度诊断×'), 'detail 应走路径 f: ' + r.detail);
});
check('F 边界：incentive 镜像形只腿①（参保后归因、无参保前否认）不判', () => {
  assert.strictEqual(hitC('问题就出在参保后的过度就医上，后续需要加强控费。'), false);
});
check('F 边界：incentive 只腿②（参保前否认、无参保后归因）不判', () => {
  assert.strictEqual(hitC('投保前的风险结构忽略就行，这与理赔分析无关。'), false);
});
check('F 边界：incentive 概念教学句不判', () => {
  assert.strictEqual(hitC('道德风险是指参保后行为变化导致赔付上升的现象，与逆选择是两种不同机制。'), false);
});

// ─── G. 登记纪律 ──────────────────────────────────────────────────
check('G VERSION / package.json 一致', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.ok(/^\d+\.\d+\.\d+$/.test(v), 'VERSION 格式非法: ' + v);
  assert.strictEqual(pkg.version, v);
});
check('G index.js 既有接线在位（两维度 require + 计算点 + dimMap 键）', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/checkImmortalTimeBias/.test(src), 'index.js 缺 checkImmortalTimeBias 接线');
  assert.ok(/immortal_time_bias/.test(src), 'index.js 缺 immortal_time_bias 维度键');
  assert.ok(/detectIncentiveBlindSpot/.test(src), 'index.js 缺 detectIncentiveBlindSpot 接线');
  assert.ok(/incentive_blind_spot/.test(src), 'index.js 缺 incentive_blind_spot 维度键');
});
check('G __internals 暴露路径 h 常量（负例注入口）', () => {
  const I = immortalInternals();
  const min = { CASE_SURGE_ZH: 1, CASE_SURGE_EN: 4, INCIDENCE_CLAIM_ZH: 4, INCIDENCE_CLAIM_EN: 4, EXEMPT_INC_ZH: 4, EXEMPT_INC_EN: 4 };
  for (const [k, n] of Object.entries(min)) {
    assert.ok(I[k] !== undefined, '__internals 缺 ' + k);
    assert.ok(Array.isArray(I[k]) && I[k].length >= n, k + ' 元素不足（< ' + n + '）');
  }
});
check('G 插件层 FAMILIES 行沿用 r343（同键同 fn，族内加腿无需新行）', () => {
  const row = (plugin.FAMILIES || []).find(f => f.key === 'incentive_conflation');
  assert.ok(row, '插件层 FAMILIES 缺行');
  assert.strictEqual(row.mod, '../../incentive-blind-spot.js');
  assert.strictEqual(row.fn, 'detectIncentiveConflation');
  assert.strictEqual(row.round, 'r343');
});

console.log(`\nround-346 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
