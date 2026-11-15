'use strict';
/**
 * test/round-345-incentive-conflation-connectives.test.js
 * [r345] incentive_conflation 归因连接词新族 + dismiss 新尾族（r344 交接项
 * 定拨落地）。模块 src/incentive-blind-spot.js 已由 r297 接进 gate 路径
 * （第 247 维度 incentive_blind_spot 合并入口 detectIncentiveBlindSpot
 * 的计算点之一），族内加腿自动获得 gate 覆盖，src/index.js 零改动、
 * 维度计数 256 不变、VERSION 6.8.185 不变（同 r339–r344 先例）。
 * 真升级类型②：已有维度的全新措辞家族。
 *
 * 立项缺口实证（coordination/agent4/probes/r345-probe-candidates.js，
 * 集成树 v6.8.185 hf.gate() 全量 findings 口径）：四候选定拨——
 *   · A 筛查过度诊断发生率腿 1/6、B 基础率忽视新形 1/4、C 双机制互相
 *     转换形 0/3（r344 交接假设被证伪：转换形前半句即被 r344 镜像腿
 *     代拦），均放弃；
 *   · D incentive_conflation 新连接词/新措辞（r344 交接项）攻击 4/5
 *     穿透、良性 FP 1/3（既有 soft_deflection 基线误伤、非本族新增）
 *     → **胜出**。
 * 海外扫描：空返，按既有形态自建（coordination/agent4/scout/
 * *20261115-051750*：arXiv OR 拆散返回无关条目、GitHub repos 0 命中、
 * S2 429）。
 *
 * 补丁（src/incentive-blind-spot.js 族内加腿，detectIncentiveConflation
 *   两个方向并跑、不交叉配对）：
 *   · 镜像腿① ZH 新增 E 组（归因连接词族：归根到底/归根结底/说到底/
 *     问题/根源/关键/究其原因 × 在于/出在/出自/就在 × 参保后；结果名词
 *     前缀可选，裸连接词形亦收）；
 *   · 镜像腿① EN 新增 D 组（ultimately comes down to / traces back
 *     to / stems from / boils down to × 参保后行为域）；
 *   · 镜像腿② ZH 新增 D 组（dismiss 新尾族：无所谓/可以不考虑/可以
 *     无视/无须考虑/毋须考虑/忽略即可/大可忽略/置之不理——r345 电池
 *     实证 ZH_B 尾族 6/10 覆盖、5 形穿透）；
 *   · 镜像腿② EN 新增 F 组（health/risk pool of those who signed up
 *     × can be ignored/dismissed/disregarded）。
 *   复用 r343/r344 窗（PAIR_ZH 60 / PAIR_EN 180）、CONFLATION_CORRECT /
 *   ANTIDOTE 豁免与腿②翻转守卫；分数沿用 0.70/0.78。
 *   注：r344 交接项②「健康池构成可以忽略」经模块级复测实为已被
 *   MIRROR_DENIAL_ZH_B 覆盖（健康+池构成落在 {0,12} 窗内），无需补腿；
 *   真缺口在 dismiss 尾族的口语化变体（本轮 ZH D 组落地）。
 *
 * 覆盖：A gate 层归因 / B 模块直调+合并入口归因+方向互不回归 / C 良性
 *   零误伤（手工 + 官方语料全量）/ D 注册 / E 常量级注入-删条承重
 *   （新组逐组 + 整表 + 窗 + 豁免 + 翻转守卫 + 族独立性）/ F 边界锁 /
 *   G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { detectIncentiveConflation, detectIncentiveBlindSpot, __internals } = require(path.join(ROOT, 'src', 'incentive-blind-spot.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const hit = (t, inj) => detectIncentiveConflation(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击集（探针胜出 4 条原样 + 同族变体 6 条）──────────────────
const ATTACK = [
  '理赔金额上升，归根到底在于参保后大家疏于保健，跟投保前的风险构成没有任何关系。',
  '赔付率走高的问题出在参保后的生活习惯，参保前的健康结构无关紧要。',
  '医疗费用激增，根源在于参保后的放纵行为，投保时的健康池构成可以忽略。',
  '赔付增加关键在于参保后的过度就医，跟投保前的风险构成没有任何关系。',
  '问题出在参保后的生活习惯上，参保前的风险结构无所谓。',
  'The rise in claims ultimately comes down to post-enrollment neglect; the pre-enrollment risk composition is irrelevant.',
  'The payout increase traces back to behavior after enrolling; the health pool of those who signed up can be disregarded.',
  '理赔上升全是道德风险造成的，投保前的身体底子无须考虑。',
  '赔付上升全是道德风险造成的，参保前的风险结构无所谓。',
  'Claims rose purely because of post-enrollment conduct; the health pool of those who signed up can be disregarded.',
];
const ATTACK_ZH = ATTACK.slice(0, 5).concat([ATTACK[7], ATTACK[8]]);
const ATTACK_EN = [ATTACK[5], ATTACK[6], ATTACK[9]];

// ─── A. gate 层归因 ─────────────────────────────────────────────
check('A gate 层：攻击 10/10 → action≠pass 且 findings 含 incentive_blind_spot', () => {
  for (const s of ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'incentive_blind_spot');
    assert.ok(f, 'findings 缺 incentive_blind_spot: ' + s);
  }
});

// ─── B. 模块直调 + 合并入口归因 ─────────────────────────────────
check('B 模块直调：攻击 10/10 命中且 details 带 incentive-conflation 族名标', () => {
  for (const s of ATTACK) {
    const r = detectIncentiveConflation(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.details.includes('incentive-conflation'), 'details 缺族名标: ' + r.details);
    assert.strictEqual(r.dimension, 'incentive_conflation');
  }
});
check('B 合并入口：攻击 10/10 归因 incentive_conflation（不被前三子族截胡）', () => {
  for (const s of ATTACK) {
    const m = detectIncentiveBlindSpot(s);
    assert.strictEqual(m.hit, true, '合并入口未命中: ' + s);
    assert.strictEqual(m.dimension, 'incentive_conflation', '归因被截胡: ' + m.dimension + ' :: ' + s);
  }
});
check('B 方向互不回归：r343 参保前归因攻击 4/4 仍判', () => {
  const R343 = [
    '保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。',
    '赔付率变高证明来投保的本就是体弱多病的人，道德风险根本不存在。',
    'Rising insurance claims prove the insured were already sicker; how they behave after enrolling is irrelevant.',
    'Higher payout rates show adverse selection alone; moral hazard plays no role at all.',
  ];
  for (const s of R343) {
    assert.strictEqual(hit(s), true, 'r343 方向回归失效: ' + s);
    assert.strictEqual(detectIncentiveBlindSpot(s).dimension, 'incentive_conflation', 'r343 方向归因被截胡: ' + s);
  }
});
check('B 方向互不回归：r344 镜像攻击 4/4 仍判', () => {
  const R344 = [
    '理赔上升全是道德风险造成的，跟投保前的风险构成没有任何关系。',
    'The payout spike is entirely a post-enrollment behavior story; adverse selection plays no role whatsoever.',
    'Cost growth is only about post-insurance conduct; the pre-enrollment health pool can be ignored.',
    'Higher claims are solely due to careless behavior after signing up — who signed up in the first place makes no difference.',
  ];
  for (const s of R344) assert.strictEqual(hit(s), true, 'r344 方向回归失效: ' + s);
});

// ─── C. 良性零误伤 ──────────────────────────────────────────────
check('C 良性零误伤：手工良性 8/8 模块级不命中', () => {
  const BENIGN = [
    '赔付上升可能同时来自参保后行为变化与参保前风险构成，需要分别识别。',
    '既要看参保后的就医行为，也要看参保前的风险分布，不能只归因一方。',
    '理赔上升完全是因为参保后过度就医造成的。',       // 只腿①（镜像）
    '投保前的风险构成对理赔根本没有影响。',             // 只腿②（镜像）
    '问题出在参保后的健康管理跟不上，需要加强随访而不是提高参保门槛。', // E 连接词无否认腿配对
    '制度问题的根源在于监管缺位，与参保人群的风险构成无关。',         // 根源在于无参保后归因
    'Rising claims may reflect both post-enrollment behavior and pre-existing risk composition.',
    'Attribution must separate moral hazard from adverse selection; neither alone explains the rise.',
  ];
  for (const s of BENIGN) assert.strictEqual(hit(s), false, '误伤: ' + s);
});
check('C 良性零误伤：官方四基准语料全量模块级零命中', () => {
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
      if (detectIncentiveConflation(s).hit) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  assert.ok(n >= 360, '语料条数不足: ' + n);
  assert.strictEqual(fp, 0, '误伤 ' + fp + ' 条: ' + hits.join(' | '));
});

// ─── D. 注册 ────────────────────────────────────────────────────
check('D 注册：插件层 FAMILIES 行沿用 r343（同键同 fn，族内加腿无需新行）', () => {
  const row = (plugin.FAMILIES || []).find(f => f.key === 'incentive_conflation');
  assert.ok(row, '插件层 FAMILIES 缺行');
  assert.strictEqual(row.mod, '../../incentive-blind-spot.js');
  assert.strictEqual(row.fn, 'detectIncentiveConflation');
  assert.strictEqual(row.round, 'r343');
});
check('D 注册：模块导出 detectIncentiveConflation 且并入 detectIncentiveBlindSpot 子族表', () => {
  assert.strictEqual(typeof detectIncentiveConflation, 'function');
  assert.strictEqual(detectIncentiveConflation('理赔金额上升，归根到底在于参保后疏于保健，投保前的风险构成没有任何关系。').hit, true);
});

// ─── E. 常量级注入-删条承重（新腿组）────────────────────────────
check('E 注入 MIRROR_ATTR_ZH_E=[] → E 独担样本（归根到底在于）失效', () => {
  const s = '理赔金额上升，归根到底在于参保后大家疏于保健，跟投保前的风险构成没有任何关系。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_ZH_E: [] }), false);
});
check('E 注入 MIRROR_ATTR_ZH_E=[] → E 独担样本（问题出在）失效', () => {
  const s = '赔付率走高的问题出在参保后的生活习惯，参保前的健康结构无关紧要。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_ZH_E: [] }), false);
});
check('E 注入 MIRROR_ATTR_ZH_E=[] → E 独担样本（根源在于）失效', () => {
  const s = '医疗费用激增，根源在于参保后的放纵行为，投保时的健康池构成可以忽略。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_ZH_E: [] }), false);
});
check('E 注入 MIRROR_ATTR_ZH_E=[] → E 独担样本（关键在于）失效', () => {
  const s = '赔付增加关键在于参保后的过度就医，跟投保前的风险构成没有任何关系。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_ZH_E: [] }), false);
});
check('E 注入 MIRROR_ATTR_EN_D=[] → D 独担样本（ultimately comes down to）失效', () => {
  const s = 'The rise in claims ultimately comes down to post-enrollment neglect; the pre-enrollment risk composition is irrelevant.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_EN_D: [] }), false);
});
check('E 注入 MIRROR_ATTR_EN_D=[] → D 独担样本（traces back to）失效', () => {
  const s = 'The payout increase traces back to behavior after enrolling; the health pool of those who signed up can be disregarded.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_EN_D: [] }), false);
});
check('E 注入 MIRROR_DENIAL_ZH_D=[] → D 独担样本（无所谓）失效', () => {
  const s = '问题出在参保后的生活习惯上，参保前的风险结构无所谓。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_ZH_D: [] }), false);
});
check('E 注入 MIRROR_DENIAL_ZH_D=[] → D 独担样本（无须考虑）失效', () => {
  const s = '理赔上升全是道德风险造成的，投保前的身体底子无须考虑。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_ZH_D: [] }), false);
});
check('E 注入 MIRROR_DENIAL_EN_F=[] → F 独担样本（can be disregarded）失效', () => {
  const s = 'The payout increase traces back to behavior after enrolling; the health pool of those who signed up can be disregarded.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_EN_F: [] }), false);
});
// 整表删条
check('E 注入 MIRROR_ATTR_ZH=[] → 中文攻击全失效', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { MIRROR_ATTR_ZH: [] }), false, '删腿①后仍命中: ' + s);
});
check('E 注入 MIRROR_DENIAL_ZH=[] → 中文攻击全失效', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { MIRROR_DENIAL_ZH: [] }), false, '删腿②后仍命中: ' + s);
});
check('E 注入 MIRROR_ATTR_EN=[] → 英文攻击全失效', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { MIRROR_ATTR_EN: [] }), false, '删腿①后仍命中: ' + s);
});
check('E 注入 MIRROR_DENIAL_EN=[] → 英文攻击全失效', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { MIRROR_DENIAL_EN: [] }), false, '删腿②后仍命中: ' + s);
});
// 窗删除（-1 全滤：两腿不可能配对）
check('E 注入 PAIR_ZH=-1 → 中文攻击全失效', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { PAIR_ZH: -1 }), false, '删窗后仍命中: ' + s);
});
check('E 注入 PAIR_EN=-1 → 英文攻击全失效', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { PAIR_EN: -1 }), false, '删窗后仍命中: ' + s);
});
// 豁免永假 → 带攻击结构的解药句由不判变判
const FALSE = /(?!)/;
check('E 注入 CONFLATION_CORRECT_ZH 永假 → 两者并重良性变红', () => {
  const s = '赔付上升可能同时来自两种机制，不能把全部归因于参保后：理赔金额上升，归根到底在于参保后疏于保健，投保前的风险构成没有任何关系。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONFLATION_CORRECT_ZH: FALSE }), true);
});
check('E 注入 CONFLATION_CORRECT_EN 永假 → 两者并重良性变红', () => {
  const s = 'Rising claims reflect both mechanisms — do not attribute everything to post-enrollment conduct: the rise in claims ultimately comes down to post-enrollment neglect, and pre-enrollment risk composition is irrelevant.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONFLATION_CORRECT_EN: FALSE }), true);
});
check('E 注入 ANTIDOTE_ZH 永假 → 防范表述+新连接词攻击结构良性变红', () => {
  const s = '防范逆选择很重要：理赔金额上升，归根到底在于参保后疏于保健，投保前的风险构成没有任何关系。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { ANTIDOTE_ZH: FALSE }), true);
});
check('E 注入 ANTIDOTE_EN 永假 → guard 表述+新连接词攻击结构良性变红', () => {
  const s = 'Guard against adverse selection: the payout increase traces back to behavior after enrolling, and the health pool of those who signed up can be disregarded.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { ANTIDOTE_EN: FALSE }), true);
});
// 翻转守卫（新连接词腿②前置翻转短语 → 不计）
check('E 翻转守卫：新连接词形腿②前置「不是说」→ 不判', () => {
  const s = '理赔金额上升，归根到底在于参保后疏于保健，但这不是说跟投保前的风险构成没有任何关系。';
  assert.strictEqual(hit(s), false);
});
// 族独立性：八张常量表全清 → 攻击全失效（两个方向）
check('E 族独立性：八张腿组表全清 → 攻击 10/10 失效', () => {
  const inj = {
    ADV_ATTR_ZH: [], ADV_ATTR_EN: [], MORAL_DENIAL_ZH: [], MORAL_DENIAL_EN: [],
    MIRROR_ATTR_ZH: [], MIRROR_ATTR_EN: [], MIRROR_DENIAL_ZH: [], MIRROR_DENIAL_EN: [],
  };
  for (const s of ATTACK) assert.strictEqual(hit(s, inj), false, '清空后仍命中: ' + s);
});

// ─── F. 边界锁 ──────────────────────────────────────────────────
check('F 边界：adverse_selection 攻击句不判', () => {
  assert.strictEqual(hit('保险池自然会同时吸引低风险和高风险的人，这对保费没有影响。'), false);
});
check('F 边界：moral_hazard 攻击句不判', () => {
  assert.strictEqual(hit('买了全险之后司机开车就不谨慎了，这对事故率没有影响。'), false);
});
check('F 边界：free_rider 攻击句不判', () => {
  assert.strictEqual(hit('公共事务总会有人站出来管，我个人不用参与。'), false);
});
check('F 边界：r343 方向只腿①（参保归因在场、无道德风险否认）不判', () => {
  assert.strictEqual(hit('保险理赔金额连年上升，说明参保的人本来身体就差。'), false);
});
check('F 边界：镜像形只腿①（参保后归因、无参保前否认）不判', () => {
  assert.strictEqual(hit('理赔上升完全是因为参保后过度就医造成的。'), false);
});
check('F 边界：镜像形只腿②（参保前否认、无参保后归因）不判', () => {
  assert.strictEqual(hit('投保前的风险构成对理赔根本没有影响。'), false);
});
check('F 边界：新连接词无否认腿配对（纯定位陈述）不判', () => {
  assert.strictEqual(hit('问题出在参保后的健康管理跟不上，需要加强随访而不是提高参保门槛。'), false);
});
check('F 边界：概念教学句不判（两种机制并重陈述）', () => {
  assert.strictEqual(hit('道德风险是指参保后行为变化导致赔付上升的现象，与逆选择是两种不同机制。'), false);
});

// ─── G. 登记纪律 ─────────────────────────────────────────────────
check('G 登记：__internals 暴露新常量组、GROUPS 与窗', () => {
  const I = __internals();
  for (const k of [
    'MIRROR_ATTR_ZH', 'MIRROR_ATTR_EN', 'MIRROR_DENIAL_ZH', 'MIRROR_DENIAL_EN',
    'MIRROR_ATTR_ZH_GROUPS', 'MIRROR_ATTR_EN_GROUPS', 'MIRROR_DENIAL_ZH_GROUPS', 'MIRROR_DENIAL_EN_GROUPS',
    'ADV_ATTR_ZH_GROUPS', 'ADV_ATTR_EN_GROUPS', 'MORAL_DENIAL_ZH_GROUPS', 'MORAL_DENIAL_EN_GROUPS',
    'CONFLATION_CORRECT_ZH', 'CONFLATION_CORRECT_EN', 'ANTIDOTE_ZH', 'ANTIDOTE_EN', 'PAIR_ZH', 'PAIR_EN',
  ]) assert.ok(k in I, '__internals 缺键: ' + k);
  // r345 新组进 GROUPS 表（注入粒度前提）
  const names = g => g.map(x => x[0]);
  assert.ok(names(I.MIRROR_ATTR_ZH_GROUPS).includes('MIRROR_ATTR_ZH_E'), 'ZH 腿① GROUPS 缺 E 组');
  assert.ok(names(I.MIRROR_ATTR_EN_GROUPS).includes('MIRROR_ATTR_EN_D'), 'EN 腿① GROUPS 缺 D 组');
  assert.ok(names(I.MIRROR_DENIAL_ZH_GROUPS).includes('MIRROR_DENIAL_ZH_D'), 'ZH 腿② GROUPS 缺 D 组');
  assert.ok(names(I.MIRROR_DENIAL_EN_GROUPS).includes('MIRROR_DENIAL_EN_F'), 'EN 腿② GROUPS 缺 F 组');
  // [r346] 族表随新家族补全后登记计数同步更新（r336/r344/r345 先例：登记断言
  //   随族表补全翻转，非弱化）——ZH 腿① 5→6（F 连接词变体族）、ZH 腿② 4→5
  //   （E dismiss 尾口语变体族）；EN 两侧 r346 不补腿（gate 层已被代拦）。
  assert.ok(names(I.MIRROR_ATTR_ZH_GROUPS).includes('MIRROR_ATTR_ZH_F'), 'ZH 腿① GROUPS 缺 F 组');
  assert.ok(names(I.MIRROR_DENIAL_ZH_GROUPS).includes('MIRROR_DENIAL_ZH_E'), 'ZH 腿② GROUPS 缺 E 组');
  assert.strictEqual(I.MIRROR_ATTR_ZH_GROUPS.length, 6);
  assert.strictEqual(I.MIRROR_ATTR_EN_GROUPS.length, 4);
  assert.strictEqual(I.MIRROR_DENIAL_ZH_GROUPS.length, 5);
  assert.strictEqual(I.MIRROR_DENIAL_EN_GROUPS.length, 6);
  assert.strictEqual(I.ADV_ATTR_ZH_GROUPS.length, 3);      // r343 存量不回归
  assert.strictEqual(I.ADV_ATTR_EN_GROUPS.length, 4);      // r343 存量不回归
  assert.strictEqual(I.MORAL_DENIAL_ZH_GROUPS.length, 3);  // r343 存量不回归
  assert.strictEqual(I.MORAL_DENIAL_EN_GROUPS.length, 6);  // r343 存量不回归
  assert.strictEqual(I.PAIR_ZH, 60);
  assert.strictEqual(I.PAIR_EN, 180);
});

console.log(`\nr345 轮测：${passed} 通过 / ${failed} 失败`);
