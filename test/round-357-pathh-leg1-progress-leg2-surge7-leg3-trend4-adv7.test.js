'use strict';
/**
 * round-357 轮测：路径 (h) 三新措辞族 + 副词扩词落地验证（r356 交接项①②③）
 *   · 新增 DETECT_UP_ZH7（腿①第十族 1 形，ZH 专项）：检查/检测/检验/诊断 +
 *     技术/手段/方法/能力/水平/工具/设备 + (的)? + 突飞猛进/日趋精湛/今胜于昔/
 *     日益精进/日臻完善（DETECT_UP_ZH p2 须 进步/提升/改进/发展/普及/推广 后缀、
 *     ZH6 须 更新换代类 动词；「日臻成熟」不收——检出手段形腿①由 LEAD_SCREEN_ZH
 *     承重非缺口）。
 *   · 新增 CASE_SURGE_ZH7（腿②第十三族 3 形，ZH 专项）：(p1) 病例名词 + 屡创新高/
 *     连创新高/屡创纪录/连创纪录；(p2) 病例名词 + (框架词)? + 井喷；(p3) 病例名词 +
 *     狂飙（legacy CASE_SURGE_ZH 激增动词表外；名词表限定病例域，用户数/销量/股价
 *     不收；后缀缺省时下一字不得为「率」同 legacy 纪律）。
 *   · 新增 INCIDENCE_CLAIM_ZH4（腿③第五族 1 形，ZH 专项）：发病率/患病率 +
 *     [≤8 字 gap] + 止跌回升/稳步回升/报复性反弹/反弹/翘尾/看高/抬头（legacy p1
 *     上升类、ZH2 攀升类、ZH3 走强类已承重故不收；round1/2 曾被 legacy p4「这种病
 *     真的在变多」污染误判无缺口，round3 干净腿框 6/6 穿透 leg3=- 证实）。
 *   · CASE_SURGE_ZH6 副词表扩词（同族补词，r356 交接项①）：+猛然/骤然/成批/批量/
 *     成群/蜂拥（新副词与旧副词表及任何其他族精确不相交，扩词不动族结构）。
 * 主块腿①九→十族、腿②十二→十三族、腿③四→五族取最早匹配；族独立常量仿
 * r338/r348–r356 先例，src/index.js 零改动，维度 256 不变，VERSION 不 bump。
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 gate+模块 + 官方语料
 *   全量 + 既有基线句隔离）/ D 存量回归（r346–r356 + 路径 a-g + 常量元素数）/
 *   E 常量级注入-删条承重（逐族 + 窗 + 扩词隔离 + 族隔离双向硬探针）/
 *   F 边界 lock / G 登记纪律。
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

// ─── 攻击集（干净腿框：非候选腿取已承重形）─────────────────────────
// ① 腿①新进步动词形（DETECT_UP_ZH7，7；腿②被重新发现 ZH3 / 浮出水面 ZH2、腿③这种病真的在变多 legacy p4）
const ATTACK_L1_PROGRESS = [
  '检查技术突飞猛进让更多病例被重新发现，这说明这种病真的在变多。',
  '检测手段日趋精湛让更多病例被重新发现，这说明这种病真的在变多。',
  '诊断方法今胜于昔让更多病例被重新发现，这说明这种病真的在变多。',
  '检验能力日益精进让更多病例被重新发现，这说明这种病真的在变多。',
  '检测技术日臻完善让更多病例被重新发现，这说明这种病真的在变多。',
  '检测技术的突飞猛进让更多病例被查出，这说明患病率真的在上升。',
  '诊断水平的日趋精湛让大批潜伏病例被查出，这表明患病率确实在提高。',
];
// ② 腿②新激增名词形（CASE_SURGE_ZH7，7；腿①普筛开展/检测升级、腿③表明患病率真的在升高 legacy p3）
const ATTACK_L2_SURGE7 = [
  '普筛开展后，病例数屡创新高，表明患病率真的在升高。',
  '体检普及以来，确诊病例连创新高，说明这种病真的在变多。',
  '筛查普及以来，新增病例呈井喷态势，说明患病率真的在上升。',
  '普筛开展后，病例井喷，表明患病率真的在升高。',
  '检测升级后，确诊病例一路狂飙，表明发病率确实在提高。',
  '筛查推广后，新增病例迎来井喷，说明患病率真的在上升。',
  '普筛开展后，患者人数屡创新高，表明这种病真的在蔓延。',
];
// ③ 腿③新趋势动词形（INCIDENCE_CLAIM_ZH4，6；腿①筛查普及/检测升级、腿②被检出 ZH3 / 浮出水面 ZH2）
const ATTACK_L3_TREND4 = [
  '筛查普及让更多病例被检出，患病率呈抬头趋势。',
  '检测升级后大量无症状感染者被确诊，患病率止跌回升。',
  '检查普及以来隐匿病灶被不断识别，患病率再度翘尾。',
  '普筛开展后大批潜伏病例浮出水面，患病率持续看高。',
  '筛查推广后大量病例被陆续确诊，患病率报复性反弹。',
  '体检普及让更多病例被查出，患病率稳步回升。',
];
// ④ 腿②低频副词形（CASE_SURGE_ZH6 扩词，6；腿①检查普及/检测升级、腿③说明患病率真的在上升 legacy p3）
const ATTACK_L2_ADV7 = [
  '检查普及以来，众多隐匿病灶被猛然发现，说明患病率真的在上升。',
  '筛查推广后，大量无症状感染者被骤然确诊，表明发病率确实在提高。',
  '普筛开展后，大批隐匿病例被成批检出，这说明这种病真的在变多。',
  '体检普及以来，越来越多潜伏病例被批量识别，表明患病率真的在升高。',
  '检测升级后，众多隐匿病灶被成群查出，说明发病率真的在上升。',
  '普筛开展后，大批隐匿病例被蜂拥确诊，这说明这种病真的在变多。',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：腿①新进步动词族攻击 7/7 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L1_PROGRESS) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿②新激增名词族攻击 7/7 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2_SURGE7) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿③新趋势动词族攻击 6/6 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L3_TREND4) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：腿②低频副词族攻击 6/6 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK_L2_ADV7) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：四候选攻击 26/26 命中且 detail 带过度诊断发生率误读标', () => {
  for (const s of [...ATTACK_L1_PROGRESS, ...ATTACK_L2_SURGE7, ...ATTACK_L3_TREND4, ...ATTACK_L2_ADV7]) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence') || r.detail.includes('过度诊断发生率误读'), 'detail 缺标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // 腿①族孪生：软件工程良性无腿②腿③ / 对冲否定 / 学术推荐
  '渲染技术突飞猛进，游戏帧率提升了两成。',
  '压缩算法日趋精湛，存储成本下降了三成。',
  '检测算法今胜于昔，误报率下降了三成。',
  '检查技术突飞猛进让更多病例被重新发现，但这并不代表发病率真的上升。',
  '检测方法日益精进，早期确诊比例明显提高，是体检中心的常规推荐。',
  // 腿②族孪生：非病例名词隔离 / 对冲否定 / 检查人次前缀不收
  '产品迭代后，用户数屡创新高，营收随之增长。',
  '促销期间销量井喷，库存为之一空。',
  '财报发布后股价狂飙，投资者情绪高涨。',
  '普筛开展后，病例数屡创新高，但这并不代表发病率真的上升。',
  '筛查普及以来，检查人次屡创新高，门诊压力显著增大。',
  // 腿③族孪生：对冲否定 / 统计口径未变 / 谨慎标记前置
  '筛查普及让更多病例被检出，患病率呈抬头趋势，但这并不代表发病率真的上升。',
  '检测升级后大量无症状感染者被确诊，患病率止跌回升，统计口径并未变化。',
  '患病率报复性反弹主要是筛查普及带来的检出增加，并不代表疾病真的蔓延。',
  // 副词族孪生：对冲否定 / 无腿③
  '检查普及以来，众多隐匿病灶被猛然发现，但这并不代表发病率真的上升。',
  '筛查推广后，大量无症状感染者被骤然确诊，均已纳入随访名单。',
];
check('C 良性零误伤：四候选手工良性 16/16 模块级路径 h 不判', () => {
  for (const s of BENIGN) {
    assert.strictEqual(hitI(s), false, '模块级误判: ' + s);
  }
});
check('C 良性零误伤：手工良性 gate 层零 immortal_time_bias 承重', () => {
  for (const s of BENIGN) {
    const r = gate(s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(!f, 'gate 层 immortal_time_bias 误承重: ' + s + ' :: ' + (r.findings || []).map(x => x.dimension).join(','));
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

// ─── D. 存量回归 ──────────────────────────────────────────────────
check('D 存量回归：r346–r356 路径 h 攻击仍命中（注入四新族/扩词置空不受影响）', () => {
  const stock = [
    // r346 腿② legacy 激增形 + 腿③现在时
    'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
    'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
    '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
    // r347 腿①检出能力变动 + 腿②旧族
    'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
    'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
    // r348 腿②被动浮现 EN2 + ZH 腿①普及形
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
    // r352 腿② infections 单助动词 EN5 + 腿③过去时 EN3
    'Thanks to ubiquitous testing, many more infections have been identified, which suggests the disease is really becoming more widespread.',
    'Screening identified many more infections, which suggests the disease is really on the rise.',
    // r353 腿① testing 名词 EN5 + 腿② case numbers EN6
    'With advanced testing, far more cases are being detected, suggesting the cancer is truly spreading.',
    'After the screening program expanded, diagnosed case numbers climbed steadily, which suggests the disease is really becoming more common.',
    // r354 EN6/EN7/EN8 新族代表句
    'Once testing coverage expanded, many more silent cases were uncovered, which showed the disease was truly becoming more widespread.',
    'Advanced testing picked up far more tumors than before, suggesting the cancer is truly becoming more common.',
    'Thanks to sensitive testing, the audit surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.',
    // r355 三新族代表句
    '新型的检验技术上线后，大量无症状感染者被确诊，表明患病率确实在提高。',
    'With sensitive testing, the scan picked up far more early-stage tumors, suggesting the cancer is truly becoming more common.',
    'With sensitive testing, numerous additional cases surfaced, proving the disease is becoming more common.',
    '随着检测普及，浮出大量潜伏病例，这说明这种病真的在变多。',
    '更先进的检测手段浮出大量潜伏病例，这说明这种病真的在变多。',
    // r356 四新族代表句
    '随着检测普及，大量潜伏病例浮现出来，这说明这种病真的在变多。',
    '检查普及以来，众多隐匿病灶被陆续发现，说明患病率真的在上升。',
    '检测手段更新换代让更多病例被重新发现，这说明患病率真的在上升。',
    '检查普及让更多病例被重新发现，患病率一路走强。',
  ];
  for (const s of stock) {
    assert.strictEqual(hitI(s), true, '存量回归失效: ' + s);
    // 只置空本轮三个新族；CASE_SURGE_ZH6 是 r356 既有族（本轮仅扩词），
    // 置空它会误伤 r356 独担句——扩词不改族结构，不参与本注入
    assert.strictEqual(hitI(s, { DETECT_UP_ZH7: [], CASE_SURGE_ZH7: [], INCIDENCE_CLAIM_ZH4: [] }), true, '被本轮新族置空误伤: ' + s);
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
  assert.strictEqual(I.DETECT_UP_EN5.length, 1, 'DETECT_UP_EN5 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN6.length, 2, 'CASE_SURGE_EN6 应保持 2');
  assert.strictEqual(I.DETECT_UP_EN6.length, 1, 'DETECT_UP_EN6(EN) 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN7.length, 1, 'CASE_SURGE_EN7 应保持 1');
  assert.strictEqual(I.CASE_SURGE_EN8.length, 2, 'CASE_SURGE_EN8 应保持 2');
  assert.strictEqual(I.CASE_SURGE_EN9.length, 2, 'CASE_SURGE_EN9 应保持 2');
  assert.strictEqual(I.DETECT_UP_ZH5.length, 1, 'DETECT_UP_ZH5 应保持 1');
  assert.strictEqual(I.CASE_SURGE_ZH4.length, 1, 'CASE_SURGE_ZH4 应保持 1');
  // r356 四新族常量元素数不变
  assert.strictEqual(I.CASE_SURGE_ZH5.length, 1, 'CASE_SURGE_ZH5 应保持 1');
  assert.strictEqual(I.DETECT_UP_ZH6.length, 2, 'DETECT_UP_ZH6 应保持 2');
  assert.strictEqual(I.INCIDENCE_CLAIM_ZH3.length, 1, 'INCIDENCE_CLAIM_ZH3 应保持 1');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
let flipCount = 0, flipTotal = 0;
const flip = (cond, msg) => { flipTotal++; if (cond) flipCount++; else throw new Error(msg); };
check('E 注入 DETECT_UP_ZH7=[] → 腿①新进步动词族攻击 7/7 翻转不判', () => {
  for (const s of ATTACK_L1_PROGRESS) flip(hitI(s, { DETECT_UP_ZH7: [] }) === false, '删 DETECT_UP_ZH7 后仍命中: ' + s);
});
check('E 注入 CASE_SURGE_ZH7=[] → 腿②新激增名词族攻击 7/7 翻转不判', () => {
  for (const s of ATTACK_L2_SURGE7) flip(hitI(s, { CASE_SURGE_ZH7: [] }) === false, '删 CASE_SURGE_ZH7 后仍命中: ' + s);
});
check('E 注入 INCIDENCE_CLAIM_ZH4=[] → 腿③新趋势动词族攻击 6/6 翻转不判', () => {
  for (const s of ATTACK_L3_TREND4) flip(hitI(s, { INCIDENCE_CLAIM_ZH4: [] }) === false, '删 INCIDENCE_CLAIM_ZH4 后仍命中: ' + s);
});
check('E 注入 CASE_SURGE_ZH6=[] → 低频副词族攻击 6/6 翻转不判（新副词无第二族承重）', () => {
  for (const s of ATTACK_L2_ADV7) flip(hitI(s, { CASE_SURGE_ZH6: [] }) === false, '删 CASE_SURGE_ZH6 后新副词形仍命中: ' + s);
});
check('E 注入 WIN_LEAD_ZH=0 → ZH 四候选攻击 26/26 全部翻转不判（窗承重）', () => {
  for (const s of [...ATTACK_L1_PROGRESS, ...ATTACK_L2_SURGE7, ...ATTACK_L3_TREND4, ...ATTACK_L2_ADV7]) flip(hitI(s, { WIN_LEAD_ZH: 0 }) === false, '清零 ZH 窗后仍命中: ' + s);
});
// ─── 族隔离反向硬探针：删旧常量后其独担句必须翻转，本轮新族不得 rescue ───
check('E 族隔离硬探针（反向）：DETECT_UP_ZH=[] → 进步/普及后缀独担句 2/2 仍翻转不判（ZH7 动词表不含进步类）', () => {
  const zh = [
    '检测手段的进步让更多病例被查出，这说明患病率真的在上升。',
    '检查的普及让更多病例被查出，这说明患病率真的在上升。',
  ];
  for (const s of zh) flip(hitI(s, { DETECT_UP_ZH: [] }) === false, '删 DETECT_UP_ZH 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_ZH6=[] → 更新换代独担句 1/1 仍翻转不判（ZH7 动词表不含更新换代类）', () => {
  const s = '检测手段更新换代让更多病例被重新发现，这说明患病率真的在上升。';
  flip(hitI(s, { DETECT_UP_ZH6: [] }) === false, '删 DETECT_UP_ZH6 后被 ZH7 承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_ZH=[] → legacy 激增独担句 1/1 仍翻转不判（ZH7 动词表不含激增类）', () => {
  const s = '筛查普及以来，新增病例激增，说明患病率真的在上升。';
  flip(hitI(s, { CASE_SURGE_ZH: [] }) === false, '删 CASE_SURGE_ZH 后被 ZH7 承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：INCIDENCE_CLAIM_ZH=[] → 上升/走高独担句 2/2 仍翻转不判（ZH4 不收上升类）', () => {
  const zh = [
    '检查普及让更多病例被重新发现，患病率真的在上升。',
    '检查普及让更多病例被重新发现，患病率节节走高。',
  ];
  for (const s of zh) flip(hitI(s, { INCIDENCE_CLAIM_ZH: [] }) === false, '删 INCIDENCE_CLAIM_ZH 后被 ZH4 承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：INCIDENCE_CLAIM_ZH2=[] → 攀升/飙升/上行独担句 3/3 仍翻转不判（ZH4 趋势动词表不收攀升类）', () => {
  const zh = [
    '检查普及让更多病例被重新发现，患病率一路攀升。',
    '检查普及让更多病例被重新发现，患病率持续飙升。',
    '检查普及让更多病例被重新发现，患病率一路上行。',
  ];
  for (const s of zh) flip(hitI(s, { INCIDENCE_CLAIM_ZH2: [] }) === false, '删 INCIDENCE_CLAIM_ZH2 后被 ZH4 承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：INCIDENCE_CLAIM_ZH3=[] → 走强独担句 1/1 仍翻转不判（ZH4 不收走强）', () => {
  const s = '检查普及让更多病例被重新发现，患病率一路走强。';
  flip(hitI(s, { INCIDENCE_CLAIM_ZH3: [] }) === false, '删 INCIDENCE_CLAIM_ZH3 后被 ZH4 承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_ZH3=[] → 被+重新发现直缀独担句 1/1 仍翻转不判（ZH6 副词必填不 rescue 直缀形）', () => {
  const s = '检查普及以来，众多隐匿病灶被重新发现，说明患病率真的在上升。';
  flip(hitI(s, { CASE_SURGE_ZH3: [] }) === false, '删 CASE_SURGE_ZH3 后被 ZH6 承重不翻转: ' + s);
});
check('E 扩词隔离硬探针：ZH6 副词表旧词形仍由 ZH6 承重（删 ZH6 翻转），新词形删 ZH6 亦翻转——扩词不改变族结构', () => {
  const old = '检查普及以来，众多隐匿病灶被陆续发现，说明患病率真的在上升。';
  assert.strictEqual(hitI(old), true, '旧副词形应命中');
  flip(hitI(old, { CASE_SURGE_ZH6: [] }) === false, '删 ZH6 后旧副词形不翻转（族结构被破坏）');
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hitI('检查技术突飞猛进让更多病例被重新发现——这说明患病率真的在上升吗？'), false, '疑问形未豁免');
});
check('F 边界锁：缺检出腿不判（腿②+腿③齐全，无普及/检出域词）', () => {
  assert.strictEqual(hitI('病例数屡创新高，表明患病率真的在升高。'), false, '缺腿①仍判');
});
check('F 边界锁：缺病例激增腿不判（腿①+腿③齐全）', () => {
  assert.strictEqual(hitI('检查技术突飞猛进后，检验科通过了iso认证，说明患病率真的在上升。'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（腿①+腿②齐全）', () => {
  assert.strictEqual(hitI('检查技术突飞猛进让更多病例被重新发现。'), false, '缺腿③仍判');
});
check('F 边界锁：腿①「日臻成熟」不收（检测技术+日臻成熟无任何腿①族承重，leg1=-）', () => {
  assert.strictEqual(hitI('检测技术日臻成熟让更多病例被重新发现，这说明患病率真的在上升。'), false, '日臻成熟被误收');
});
check('F 边界锁：腿②名词隔离（用户数/销量/股价 + 创新高/井喷/狂飙 不收）', () => {
  assert.strictEqual(hitI('产品迭代后，用户数屡创新高，说明这种病真的在变多。'), false, '用户数误收');
  assert.strictEqual(hitI('促销期间销量井喷，说明患病率真的在上升。'), false, '销量误收');
  assert.strictEqual(hitI('财报发布后股价狂飙，说明发病率真的在提高。'), false, '股价误收');
});
check('F 边界锁：腿②「检查」前缀不收（检查人次屡创新高）', () => {
  assert.strictEqual(hitI('筛查普及以来，检查人次屡创新高，说明患病率真的在上升。'), false, '检查人次误收');
});
check('F 边界锁：腿③一路上行/节节走高由 ZH2/legacy 承重（ZH4 置空不影响）', () => {
  const s1 = '检查普及让更多病例被重新发现，患病率一路上行。';
  const s2 = '检查普及让更多病例被重新发现，患病率节节走高。';
  assert.strictEqual(hitI(s1), true, '一路上行应命中');
  assert.strictEqual(hitI(s2), true, '节节走高应命中');
  assert.strictEqual(hitI(s1, { INCIDENCE_CLAIM_ZH4: [] }), true, 'ZH4 置空影响了 ZH2 上行形');
  assert.strictEqual(hitI(s2, { INCIDENCE_CLAIM_ZH4: [] }), true, 'ZH4 置空影响了 legacy 走高形');
});
check('F 边界锁：腿③否定后置豁免（可能并没有抬头/谈不上止跌回升）', () => {
  assert.strictEqual(hitI('检查普及让更多病例被重新发现，患病率可能并没有抬头。'), false, '否定后置未豁免');
  assert.strictEqual(hitI('检查普及让更多病例被重新发现，患病率谈不上止跌回升。'), false, '否定后置未豁免');
});
check('F 边界锁：跨腿邻近窗（ZH 三腿相隔 >160 字符不判）', () => {
  const filler = '这是一段完全无关的社区活动筹备说明，涵盖场地预订、桌椅数量核对、音响设备调试、志愿者排班、天气与交通提醒、为期两周的准备窗口、附件表格里的预算与物资清单、已经用邮件发出的会议通知，以及任何临时变动都会在群里同步。感谢大家的配合，期待活动顺利举行、出席率良好、现场执行顺畅。第二部分补充说明：彩排时间定在周四晚上，签到台需要两名志愿者，餐饮供应商会提前一天把食材送到现场，停车位有限请大家尽量拼车前往，现场网络由场地方提供，备用方案是移动热点。';
  const s = '检查技术突飞猛进' + filler + '让更多病例被重新发现，这说明患病率真的在上升。';
  assert.ok(s.indexOf('被重新发现') > 160, '样本腿②跨度未超窗（样本构造失败）');
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
check('G __internals 暴露三新族常量且元素数符合登记（ZH7 恰 1 / ZH7 腿②恰 3 / ZH4 恰 1 / ZH6 副词扩词后恰 1 形含 6 新副词）', () => {
  const I = immortalInternals();
  assert.ok(Array.isArray(I.DETECT_UP_ZH7) && I.DETECT_UP_ZH7.length === 1, 'DETECT_UP_ZH7 应为 1 形');
  assert.ok(Array.isArray(I.CASE_SURGE_ZH7) && I.CASE_SURGE_ZH7.length === 3, 'CASE_SURGE_ZH7 应为 3 形');
  assert.ok(Array.isArray(I.INCIDENCE_CLAIM_ZH4) && I.INCIDENCE_CLAIM_ZH4.length === 1, 'INCIDENCE_CLAIM_ZH4 应为 1 形');
  assert.ok(Array.isArray(I.CASE_SURGE_ZH6) && I.CASE_SURGE_ZH6.length === 1, 'CASE_SURGE_ZH6 应保持 1 形');
  const src = I.CASE_SURGE_ZH6[0].source;
  for (const adv of ['猛然', '骤然', '成批', '批量', '成群', '蜂拥']) {
    assert.ok(src.includes(adv), 'CASE_SURGE_ZH6 副词表缺新词: ' + adv);
  }
});

console.log(`\nround-357 轮测：passed=${passed} failed=${failed}`);
if (failed > 0 || flipTotal !== flipCount) {
  console.log(`注入翻转：${flipCount}/${flipTotal}`);
  process.exit(1);
}
console.log(`注入翻转：${flipCount}/${flipTotal}`);
console.log('round-357 轮测全部通过');
