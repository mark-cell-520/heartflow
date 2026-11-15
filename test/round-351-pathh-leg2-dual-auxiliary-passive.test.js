'use strict';
/**
 * test/round-351-pathh-leg2-dual-auxiliary-passive.test.js
 * [r351] 路径 (h) 腿②双助动词被动形（真升级类型②：已有维度的全新措辞
 * 家族，维度计数 256 不变、src/index.js 零改动、VERSION 6.8.185 不 bump，
 * 同 r339–r350 先例：族内补形不 bump）。
 *
 * r351 立项探针（coordination/agent4/probes/r351-probe-candidates.js，集成
 * 树 v6.8.185 gate() 全量 findings 口径）三候选定拨：
 *   候选 A Berkson 住院选择形（collider_bias COND_EN 缺 hospitalized/
 *     inpatient）攻击 10 穿透 6（全 EN 腿①纯形缺口，3 条 ZH 已被
 *     collider_bias 代拦）、良性 1/6 为既有基线误伤（liberty_restriction）
 *     → 穿透率低于 B 且需改共享常量 COND_EN，本轮不立项（留交接）；
 *   候选 B 腿②双助动词被动形（are/were/is being + 检出动词）攻击 7/7
 *     穿透、良性 6/6 零误伤 → 落地（本轮）；
 *   候选 C 腿②名词表缺 infections/illnesses（legacy p9 名词表仅 cases/
 *     patients/tumors/cancers/lesions）攻击 4/6 穿透、良性 1/4 为既有
 *     基线误伤（post_hoc）→ 单助动词形留交接（双助动词×infections 交集
 *     由本轮新族覆盖）。
 * 中文侧同形探针（coordination/agent4/probes/r351-probe-zh-dualaux.js）：
 * 4/4 已被 immortal_time_bias 代拦，无缺口，本族 EN 专项。
 * 海外扫描：arXiv parse-fail、GitHub total_count 0 空返、S2 空返——按
 * 既有形态自建，未编造命中。
 *
 * 补丁（src/immortal-time-bias.js，既有路径与常量零改动，只追加 + 主块
 * 接线第四族腿②）：
 *   · 新增 CASE_SURGE_EN4（腿②第四族 3 形：p1a 量化+more+病例名词+
 *     are/were/is+being+检出动词；p1b 形容词量化+numerous additional/
 *     hidden/previously undiagnosed+病例名词+双助动词+检出动词，镜像
 *     CASE_SURGE_EN3 p3 形容词量化族设计；p2 a growing number of+病例
 *     名词+are/is+being+检出动词）。名词表含 infections/illnesses。
 *   · 路径 (h) 主块腿②四族取最早匹配；__internals 登记新常量
 *   · 族独立常量（*4 后缀）而非追加既有家族表：r346–r350 五轮测以精确
 *     equality/注入钉死既有常量元素数与承重（CASE_SURGE_EN 恰 12、
 *     CASE_SURGE_EN2 恰 5、CASE_SURGE_EN3 恰 6、DETECT_UP_EN 恰 5），
 *     追加会打破存量断言——独立族零触碰存量测试（r338/r348–r350 先例）。
 *
 * 实现教训（本轮两条攻击句按纪律换措辞/留交接，不扩既有常量）：
 * ① 「which showed the disease was truly spreading」腿③缺口——INCIDENCE_
 *     CLAIM_EN 推断词表只有 shows/showing 无 showed、p2 只收 is/are 无
 *     was，测试句换 "which shows the disease is truly spreading"；
 * ② 「Thanks to sensitive testing」腿①缺口——DETECT_UP_EN p3 名词表
 *     （imaging/scans/scanning/tests/assays/screening）缺 testing，
 *     DETECT_UP_EN4 只收 ubiquitous/widespread/mass testing 不收
 *     sensitive/advanced testing，测试句换 "ubiquitous testing"，
 *     sensitive testing 腿①缺口列入交接。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 gate+模块 + 官方
 *   语料全量）/ D 存量回归（r346–r350 + 路径 a-g + 常量元素数）/ E 常量级
 *   注入-删条承重（逐族 + 窗 + 族隔离双向硬探针）/ F 边界锁 / G 登记纪律。
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

// ─── 攻击集（EN 双助动词被动 7，全部立项探针 PEN 纯形）────────────────
const ATTACK = [
  // p1a: 量化 + more + 名词 + are being + 检出动词
  'With the growing use of MRI, far more lesions are being detected, suggesting the disease is really spreading.',
  'Ubiquitous testing means many more infections are being caught, which suggests the disease is truly becoming more widespread.',
  'With wider screening uptake, many more tumors are being picked up, suggesting the cancer is really becoming more common.',
  // p1b: 形容词量化 + 名词 + are being + 检出动词（无 more 前缀）
  'As CT scanning became universal, numerous additional cases are being identified, indicating the illness is genuinely on the rise.',
  // were being 过去双助动词形
  'After the screening program expanded, far more cases were being diagnosed each year, which shows the disease is truly spreading.',
  'Once mass testing began, many more infections were being identified, suggesting the illness is really becoming more common.',
  // p2: a growing number of + 名词 + is being + 检出动词
  'Thanks to ubiquitous testing, a growing number of cases is being detected, which suggests the disease is really on the rise.',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：腿②第四族攻击 7/7 action≠pass 且 immortal_time_bias 承重', () => {
  for (const s of ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：第四族 EN 7/7 命中且 detail 带 overdiagnosis-incidence 标', () => {
  for (const s of ATTACK) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis-incidence'), 'detail 缺标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // EN 良性孪生（新腿②承重 + 旧豁免族兜底：true/underlying/actual incidence stable）
  'With the growing use of MRI, far more lesions are being detected, yet the underlying rate appears stable.',
  'As CT scanning became universal, numerous additional cases are being identified, but the true incidence may be unchanged.',
  'Ubiquitous testing means many more infections are being caught, though the actual prevalence does not appear to be rising.',
  'After the screening program expanded, far more cases were being diagnosed each year, though the real incidence seems unchanged once ascertainment is accounted for.',
  // 良性工程/医疗陈述（无发生率结论腿）
  'The radiology department reports that more images are being processed per day after the system upgrade.',
  '随着检测流程改造，更多样本正在被检测，实验室周转时间明显缩短。',
];
check('C 良性零误伤：第四族手工良性 6/6 gate 层 pass 且模块级不判', () => {
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

// ─── D. 存量回归 ──────────────────────────────────────────────────
check('D 存量回归：r346–r350 路径 h 攻击仍命中（注入新族置空不受影响）', () => {
  const stock = [
    // r346 腿② legacy 激增形（EN 3）
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
    // r349 腿②被动深形 EN3（brought to light / got picked up）
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
  ];
  for (const s of stock) {
    assert.strictEqual(hitI(s), true, '存量回归失效: ' + s);
    assert.strictEqual(hitI(s, { CASE_SURGE_EN4: [] }), true, '被 CASE_SURGE_EN4 置空误伤: ' + s);
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
  assert.strictEqual(I.LEAD_SCREEN_ZH.length, 2, 'LEAD_SCREEN_ZH 不应被改');
  assert.strictEqual(I.LEAD_SCREEN_EN.length, 5, 'LEAD_SCREEN_EN 不应被改');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
let flipCount = 0, flipTotal = 0;
const flip = (cond, msg) => { flipTotal++; if (cond) flipCount++; else throw new Error(msg); };
check('E 注入 CASE_SURGE_EN4=[] → 第四族 EN 独担攻击 7/7 翻转不判', () => {
  for (const s of ATTACK) flip(hitI(s, { CASE_SURGE_EN4: [] }) === false, '删 CASE_SURGE_EN4 后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_EN=0 → 新族攻击 7/7 全部翻转不判（窗承重）', () => {
  for (const s of ATTACK) flip(hitI(s, { WIN_LEAD_EN: 0 }) === false, '清零 EN 窗后仍命中: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN=[旧 7 形] → r347 腿②新模式独担句 5/5 仍翻转不判（新族不得 rescue）', () => {
  const I = immortalInternals();
  const old = { CASE_SURGE_EN: I.CASE_SURGE_EN.slice(0, 7) };
  // 同 r347 轮测 NEW_LEG2 口径：腿②由 r346 旧形承重的句（DET-1/DET-2/
  // DET-5 旧 p1、HED-2 旧 p7 "Screening surfaced far more tumors"）不在
  // 本注入翻转集——该句 legacy p7 承重，非 r347 新模式独担句
  const r347newLeg2 = [
    'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
    'New imaging technology detects far more tumors, and the incidence appears to be climbing.',
    'Diagnosed cases tripled after the screening program, and the disease seems to be becoming more common.',
    'With so many more cases detected, the disease appears to be spreading.',
    'Since screening expanded, far more cases have been detected, and the incidence appears to be climbing.',
  ];
  for (const s of r347newLeg2) flip(hitI(s, old) === false, '删旧 7 形后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN3=[] → r349 第三族独担句 5/5 仍翻转不判', () => {
  const r349en3 = [
    'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
    'The rollout of population screening meant that numerous previously undiagnosed cases were brought to light, proving the illness is genuinely becoming more widespread.',
    'Thanks to better surveillance, far more infections got picked up, indicating the disease is truly on the rise.',
    'With improved surveillance, many previously unnoticed cases were identified, and the disease is clearly on the rise.',
    'Broader screening means far more silent infections were detected, indicating the disease is truly becoming more common.',
  ];
  for (const s of r349en3) flip(hitI(s, { CASE_SURGE_EN3: [] }) === false, '删 CASE_SURGE_EN3 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：CASE_SURGE_EN2=[] → r348 are-now-found 承重句 2/2 仍翻转不判', () => {
  const r348en2 = [
    'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
    'Increased uptake of screening has brought many more cases to light — the incidence is truly climbing.',
  ];
  for (const s of r348en2) flip(hitI(s, { CASE_SURGE_EN2: [] }) === false, '删 CASE_SURGE_EN2 后被新族承重不翻转: ' + s);
});
check('E 族隔离硬探针（反向）：DETECT_UP_EN4=[] → r350 腿①名词化族独担句 4/4 仍翻转不判', () => {
  const r350en4 = [
    'The widespread adoption of CT scans has identified many more tumors, which shows the cancer is truly becoming more prevalent.',
    'Mass testing campaigns have detected many more cases, which suggests the disease is truly spreading.',
    'With CT now standard practice, the number of diagnosed cases has tripled, suggesting the cancer is really becoming more common.',
    'Thanks to ubiquitous testing, the number of reported cases has tripled, which suggests the disease is really becoming more widespread.',
  ];
  for (const s of r350en4) flip(hitI(s, { DETECT_UP_EN4: [] }) === false, '删 DETECT_UP_EN4 后被新族承重不翻转: ' + s);
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
  assert.strictEqual(hitI('Ubiquitous testing means many more infections are being caught — is the disease truly becoming more widespread?'), false, '疑问形未豁免');
});
check('F 边界锁：缺检出腿不判（双助动词检出 + 发生率结论，无普及/检出域词）', () => {
  assert.strictEqual(hitI('Many more cases are being identified across the region this year, suggesting the disease is really becoming more common.'), false, '缺腿①仍判');
});
check('F 边界锁：缺病例激增腿不判（普及检出 + 发生率结论）', () => {
  assert.strictEqual(hitI('Thanks to ubiquitous testing, the disease appears to be really on the rise.'), false, '缺腿②仍判');
});
check('F 边界锁：缺发生率结论腿不判（普及检出 + 双助动词检出）', () => {
  assert.strictEqual(hitI('Thanks to ubiquitous testing, many more cases are being detected this year.'), false, '缺腿③仍判');
});
check('F 边界锁：单助动词被动形非本族（legacy p9 专属，模块级由 legacy 承重不变）', () => {
  // "more cases are detected" 单助动词形由 legacy CASE_SURGE_EN p9 承重——
  // 注入 CASE_SURGE_EN4=[] 不影响（证新族与 legacy 无交集）
  const s = 'Ubiquitous testing means many more cases are detected, which suggests the disease is truly becoming more widespread.';
  assert.strictEqual(hitI(s), true, 'legacy 单助动词形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN4: [] }), true, '新族置空影响了 legacy 单助动词形');
});
check('F 边界锁：EN2 are-now-found 形非本族（新族置空不影响）', () => {
  const s = 'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.';
  assert.strictEqual(hitI(s), true, 'EN2 are-now-found 形应命中');
  assert.strictEqual(hitI(s, { CASE_SURGE_EN4: [] }), true, '新族置空影响了 EN2 形');
});
check('F 边界锁：跨腿邻近窗（三腿相隔 >400 字符不判）', () => {
  const filler = 'This paragraph is an unrelated community-event planning note covering venue booking, table and chair counts, sound-system debugging, volunteer scheduling, weather and transit reminders, a two-week preparation window, budget and supply lists in an attached spreadsheet, meeting notices already sent by email, and any last-minute changes will be synced in the group chat. Thanks to everyone for cooperating, and we look forward to a successful event with good attendance and smooth on-site execution throughout the day.';
  const s = 'Ubiquitous testing means ' + filler + ' many more infections are being caught, which suggests the disease is truly becoming more widespread.';
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
check('G __internals 暴露新族常量 CASE_SURGE_EN4 且元素数符合登记（3 形）', () => {
  const I = immortalInternals();
  assert.ok(Array.isArray(I.CASE_SURGE_EN4) && I.CASE_SURGE_EN4.length === 3, 'CASE_SURGE_EN4 应为 3 形');
});

console.log(`\n负例注入汇总: ${flipCount}/${flipTotal} 个翻转断言全部翻转`);
console.log(`round-351 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
