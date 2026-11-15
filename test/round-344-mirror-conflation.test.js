'use strict';
/**
 * test/round-344-mirror-conflation.test.js
 * [r344] 镜像归因混淆（mirror attribution conflation）——incentive_conflation
 * 子族的对称腿组（r343 交接项）。模块 src/incentive-blind-spot.js 已由
 * r297 接进 gate 路径（第 247 维度 incentive_blind_spot 合并入口
 * detectIncentiveBlindSpot 的计算点之一），族内加腿自动获得 gate 覆盖，
 * src/index.js 零改动、维度计数 256 不变、VERSION 6.8.185 不变。
 * 真升级类型②：已有维度的全新措辞家族。
 *
 * 立项缺口实证（coordination/agent4/probes/r344-probe-candidates.js，
 * 集成树 v6.8.185 hf.gate() 全量 findings 口径）：三候选定拨——
 *   · A 镜像归因混淆（结果全部归因参保后行为变化/道德风险，同时抹掉
 *     参保前风险构成/逆选择）攻击 4/8 穿透、良性 1/6（该 1 条为既有
 *     soft_deflection 基线误伤、非本族新增）→ **胜出**；
 *   · B 均值回归新形 1/4+良性 2/4、C 禀赋效应新措辞 1/4+良性 0/4，
 *     均放弃。海外扫描：空返，按既有形态自建（coordination/agent4/scout/
 *     *20261115-035751*：arXiv 空返、GitHub repos 0 命中、S2 429）。
 *
 * 补丁（src/incentive-blind-spot.js 加镜像腿组，detectIncentiveConflation
 *   两个方向并跑、不交叉配对）：
 *   镜像腿① MIRROR_ATTR（参保后行为归因在场）ZH 四组 q/r/s/t / EN 三组
 *     u/v/w；镜像腿② MIRROR_DENIAL（参保前风险否认/排他）ZH 三组 x/y/z /
 *     EN 五组 aa/ab/ac/ad/ae；复用 r343 的窗（PAIR_ZH 60 / PAIR_EN 180）、
 *     CONFLATION_CORRECT 豁免、ANTIDOTE 豁免与腿②翻转守卫；
 *   分数沿用 0.70/0.78（同族同分，detectIncentiveBlindSpot 取最高分
 *   命中时归因不被前三子族截胡）。
 *   注册：插件层 FAMILIES 行沿用 r343（同键同 fn，族内加腿无需新行）。
 *
 * 覆盖：A gate 层归因 / B 模块直调+合并入口归因 / C 良性零误伤
 *   （手工 + 官方语料全量 + r343 边界锁翻转登记）/ D 注册 / E 常量级
 *   注入-删条承重（镜像腿组逐组 + 整表 + 窗 + 豁免 + 守卫）/ F 边界锁
 *   （前三子族领地+镜像形+概念教学+单腿）/ G 登记纪律。
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

// ─── 攻击集（探针胜出 4 条原样 + 同族变体 4 条）──────────────────
const ATTACK = [
  '出险频率增加只反映参保后的生活习惯问题，参保时的身体底子没有任何影响。',
  'Claims rose purely because people neglect their health after enrolling; the risk profile of the insured before enrollment is irrelevant.',
  'The payout spike is entirely a post-enrollment behavior story; adverse selection plays no role whatsoever.',
  'Cost growth is only about post-insurance conduct; the pre-enrollment health pool can be ignored.',
  '理赔上升全是道德风险造成的，跟投保前的风险构成没有任何关系。',
  '赔付率变高说明参保后行为放纵是唯一原因，投保前的健康状况无关紧要。',
  'Higher claims are solely due to careless behavior after signing up — who signed up in the first place makes no difference.',
  'The cost surge is entirely a post-insurance conduct issue; adverse selection can be ruled out.',
];
const ATTACK_ZH = [ATTACK[0], ATTACK[4], ATTACK[5]];
const ATTACK_EN = [ATTACK[1], ATTACK[2], ATTACK[3], ATTACK[6], ATTACK[7]];

// ─── A. gate 层归因 ─────────────────────────────────────────────
check('A gate 层：攻击 8/8 → action≠pass 且 findings 含 incentive_blind_spot', () => {
  for (const s of ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'incentive_blind_spot');
    assert.ok(f, 'findings 缺 incentive_blind_spot: ' + s);
  }
});

// ─── B. 模块直调 + 合并入口归因 ─────────────────────────────────
check('B 模块直调：攻击 8/8 命中且 details 带 incentive-conflation 族名标', () => {
  for (const s of ATTACK) {
    const r = detectIncentiveConflation(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.details.includes('incentive-conflation'), 'details 缺族名标: ' + r.details);
    assert.strictEqual(r.dimension, 'incentive_conflation');
  }
});
check('B 合并入口：攻击 8/8 归因 incentive_conflation（不被前三子族截胡）', () => {
  for (const s of ATTACK) {
    const m = detectIncentiveBlindSpot(s);
    assert.strictEqual(m.hit, true, '合并入口未命中: ' + s);
    assert.strictEqual(m.dimension, 'incentive_conflation', '归因被截胡: ' + m.dimension + ' :: ' + s);
  }
});
check('B 方向互不回归：r343 参保前归因攻击 4/4 仍判（双向并跑）', () => {
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

// ─── C. 良性零误伤 ──────────────────────────────────────────────
check('C 良性零误伤：手工良性 11/11 模块级不命中', () => {
  const BENIGN = [
    '赔付上升可能同时来自参保后行为变化与参保前风险构成，需要分别识别。',
    '既要看参保后的就医行为，也要看参保前的风险分布，不能只归因一方。',
    '参保后疏于保健会推高理赔，但投保人群本来的风险构成同样在起作用。',
    '道德风险与逆选择是两种机制，识别方法不同，不能混为一谈。',
    'Rising claims may reflect both post-enrollment behavior and pre-existing risk composition.',
    'Post-enrollment behavior is one driver, but the risk profile of enrollees matters too.',
    'Attribution must separate moral hazard from adverse selection; neither alone explains the rise.',
    'Both mechanisms operate simultaneously; the risk composition of enrollees is highly relevant.',
    '理赔上升完全是因为参保后过度就医造成的。',   // 只腿①（镜像）
    '投保前的风险构成对理赔根本没有影响。',       // 只腿②（镜像）
    '理赔上升全是道德风险造成的，但这不是说跟投保前的风险构成没有任何关系。', // 腿②翻转
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
  assert.strictEqual(detectIncentiveConflation('理赔上升全是道德风险造成的，逆选择根本不存在。').hit, true);
});

// ─── E. 常量级注入-删条承重（镜像腿组）────────────────────────
// 镜像腿① ZH 四组逐组删条（每组独担样本失效）
check('E 注入 MIRROR_ATTR_ZH_A=[] → A 独担样本失效', () => {
  const s = '理赔金额上升都是因为参保后大家不注意保健了，跟参保前风险构成没有关系。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_ZH_A: [] }), false);
});
check('E 注入 MIRROR_ATTR_ZH_B=[] → B 独担样本失效', () => {
  const s = '参保后过度就医是唯一原因，这推高了赔付，跟投保前的风险构成没有关系。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_ZH_B: [] }), false);
});
check('E 注入 MIRROR_ATTR_ZH_C=[] → C 独担样本失效', () => {
  const s = '赔付变化完全是由于参保后疏于保健，跟投保前的风险构成没有关系。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_ZH_C: [] }), false);
});
check('E 注入 MIRROR_ATTR_ZH_D=[] → D 独担样本失效', () => {
  const s = '理赔上升全是道德风险造成的，跟投保前的风险构成没有任何关系。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_ZH_D: [] }), false);
});
// 镜像腿① EN 三组逐组删条
check('E 注入 MIRROR_ATTR_EN_A=[] → A 独担样本失效', () => {
  const s = 'It is entirely a post-enrollment behavior story; adverse selection plays no role.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_EN_A: [] }), false);
});
check('E 注入 MIRROR_ATTR_EN_B=[] → B 独担样本失效', () => {
  const s = 'The rise is only about post-insurance conduct; adverse selection can be ruled out.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_EN_B: [] }), false);
});
check('E 注入 MIRROR_ATTR_EN_C=[] → C 独担样本失效', () => {
  const s = 'Claims rose only slightly, and the risk profile of the insured is irrelevant.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_ATTR_EN_C: [] }), false);
});
// 镜像腿② ZH 三组逐组删条
check('E 注入 MIRROR_DENIAL_ZH_A=[] → A 独担样本失效', () => {
  const s = '理赔上升全是道德风险造成的，跟参保前风险构成没有关系。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_ZH_A: [] }), false);
});
check('E 注入 MIRROR_DENIAL_ZH_B=[] → B 独担样本失效', () => {
  const s = '赔付率变高说明参保后行为放纵是唯一原因，投保前的健康状况无关紧要。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_ZH_B: [] }), false);
});
check('E 注入 MIRROR_DENIAL_ZH_C=[] → C 独担样本失效', () => {
  const s = '理赔上升全是道德风险造成的，逆选择根本不存在。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_ZH_C: [] }), false);
});
// 镜像腿② EN 五组逐组删条
check('E 注入 MIRROR_DENIAL_EN_A=[] → A 独担样本失效', () => {
  const s = 'The payout spike is entirely a post-enrollment behavior story; adverse selection plays no role whatsoever.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_EN_A: [] }), false);
});
check('E 注入 MIRROR_DENIAL_EN_B=[] → B 独担样本失效', () => {
  const s = 'Claims rose purely because people neglect their health after enrolling; the risk profile of the insured before enrollment is irrelevant.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_EN_B: [] }), false);
});
check('E 注入 MIRROR_DENIAL_EN_C=[] → C 独担样本失效', () => {
  const s = 'Cost growth is only about post-insurance conduct; the pre-enrollment health pool can be ignored.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_EN_C: [] }), false);
});
check('E 注入 MIRROR_DENIAL_EN_D=[] → D 独担样本失效', () => {
  const s = 'Claims rose purely because of post-enrollment conduct; it has nothing to do with pre-enrollment risk.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_EN_D: [] }), false);
});
check('E 注入 MIRROR_DENIAL_EN_E=[] → E 独担样本失效', () => {
  const s = 'Higher claims are solely due to careless behavior after signing up — who signed up in the first place makes no difference.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIRROR_DENIAL_EN_E: [] }), false);
});
// 整表删条
check('E 注入 MIRROR_ATTR_ZH=[] → 中文镜像攻击全失效', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { MIRROR_ATTR_ZH: [] }), false, '删腿①后仍命中: ' + s);
});
check('E 注入 MIRROR_DENIAL_ZH=[] → 中文镜像攻击全失效', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { MIRROR_DENIAL_ZH: [] }), false, '删腿②后仍命中: ' + s);
});
check('E 注入 MIRROR_ATTR_EN=[] → 英文镜像攻击全失效', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { MIRROR_ATTR_EN: [] }), false, '删腿①后仍命中: ' + s);
});
check('E 注入 MIRROR_DENIAL_EN=[] → 英文镜像攻击全失效', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { MIRROR_DENIAL_EN: [] }), false, '删腿②后仍命中: ' + s);
});
// 窗删除（-1 全滤：两腿不可能配对）
check('E 注入 PAIR_ZH=-1 → 中文镜像攻击全失效', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { PAIR_ZH: -1 }), false, '删窗后仍命中: ' + s);
});
check('E 注入 PAIR_EN=-1 → 英文镜像攻击全失效', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { PAIR_EN: -1 }), false, '删窗后仍命中: ' + s);
});
// 豁免永假 → 带攻击结构的解药句由不判变判
const FALSE = /(?!)/;
check('E 注入 CONFLATION_CORRECT_ZH 永假 → 两者并重良性变红', () => {
  const s = '赔付上升可能同时来自两种机制，不能把全部归因于参保后：理赔上升全是道德风险造成的，投保前的风险构成没有任何关系。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONFLATION_CORRECT_ZH: FALSE }), true);
});
check('E 注入 CONFLATION_CORRECT_EN 永假 → 两者并重良性变红', () => {
  const s = 'Rising claims reflect both mechanisms — do not attribute everything to post-enrollment conduct: the payout spike is entirely a post-enrollment behavior story, and adverse selection plays no role.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONFLATION_CORRECT_EN: FALSE }), true);
});
check('E 注入 ANTIDOTE_ZH 永假 → 防范表述+镜像攻击结构良性变红', () => {
  const s = '防范逆选择很重要：理赔上升全是道德风险造成的，投保前的风险构成没有任何关系。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { ANTIDOTE_ZH: FALSE }), true);
});
check('E 注入 ANTIDOTE_EN 永假 → guard 表述+镜像攻击结构良性变红', () => {
  const s = 'Guard against adverse selection: the payout spike is entirely a post-enrollment behavior story, and adverse selection plays no role.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { ANTIDOTE_EN: FALSE }), true);
});
// 翻转守卫（镜像腿②前置翻转短语 → 不计）
check('E 翻转守卫：镜像腿②前置「不是说」→ 不判', () => {
  const s = '理赔上升全是道德风险造成的，但这不是说跟投保前的风险构成没有任何关系。';
  assert.strictEqual(hit(s), false);
});
check('E 翻转守卫：镜像腿②前置「not that」→ 不判', () => {
  const s = 'The payout spike is entirely a post-enrollment behavior story; it is not that adverse selection plays no role.';
  assert.strictEqual(hit(s), false);
});
// 族独立性：八张常量表全清 → 攻击全失效（两个方向）
check('E 族独立性：八张腿组表全清 → 攻击 8/8 失效', () => {
  const inj = {
    ADV_ATTR_ZH: [], ADV_ATTR_EN: [], MORAL_DENIAL_ZH: [], MORAL_DENIAL_EN: [],
    MIRROR_ATTR_ZH: [], MIRROR_ATTR_EN: [], MIRROR_DENIAL_ZH: [], MIRROR_DENIAL_EN: [],
  };
  for (const s of ATTACK) assert.strictEqual(hit(s, inj), false, '清空后仍命中: ' + s);
});

// ─── F. 边界锁 ──────────────────────────────────────────────────
check('F 边界：adverse_selection 攻击句不判（无参保后归因+参保前否认对）', () => {
  assert.strictEqual(hit('保险池自然会同时吸引低风险和高风险的人，这对保费没有影响。'), false);
});
check('F 边界：moral_hazard 攻击句不判（无归因混淆双腿）', () => {
  assert.strictEqual(hit('买了全险之后司机开车就不谨慎了，这对事故率没有影响。'), false);
});
check('F 边界：free_rider 攻击句不判', () => {
  assert.strictEqual(hit('公共事务总会有人站出来管，我个人不用参与。'), false);
});
check('F 边界：r343 方向只腿①（参保归因在场、无道德风险否认）不判', () => {
  assert.strictEqual(hit('保险理赔金额连年上升，说明参保的人本来身体就差。'), false);
});
check('F 边界：r343 原「只腿②」样本 r344 起正是镜像形（边界锁随家族补全翻转）', () => {
  // r343 时该句为边界（不判）；r344 镜像腿组落地后它正是镜像归因混淆：
  // 腿①「理赔上升是因为道德风险」× 腿②「跟参保的人本身健康状况没有关系」。
  // 按 r338 先例，边界锁随家族表补全翻转登记，非弱化。
  assert.strictEqual(hit('保险公司理赔上升是因为道德风险问题，跟参保的人本身健康状况没有关系。'), true);
});
check('F 边界：镜像形只腿①（参保后归因、无参保前否认）不判', () => {
  assert.strictEqual(hit('理赔上升完全是因为参保后过度就医造成的。'), false);
});
check('F 边界：镜像形只腿②（参保前否认、无参保后归因）不判', () => {
  assert.strictEqual(hit('投保前的风险构成对理赔根本没有影响。'), false);
});
check('F 边界：概念教学句不判（两种机制并重陈述）', () => {
  assert.strictEqual(hit('道德风险是指参保后行为变化导致赔付上升的现象，与逆选择是两种不同机制。'), false);
});

// ─── G. 登记纪律 ─────────────────────────────────────────────────
check('G 登记：__internals 暴露镜像常量组、GROUPS 与窗', () => {
  const I = __internals();
  for (const k of [
    'MIRROR_ATTR_ZH', 'MIRROR_ATTR_EN', 'MIRROR_DENIAL_ZH', 'MIRROR_DENIAL_EN',
    'MIRROR_ATTR_ZH_GROUPS', 'MIRROR_ATTR_EN_GROUPS', 'MIRROR_DENIAL_ZH_GROUPS', 'MIRROR_DENIAL_EN_GROUPS',
    'ADV_ATTR_ZH_GROUPS', 'ADV_ATTR_EN_GROUPS', 'MORAL_DENIAL_ZH_GROUPS', 'MORAL_DENIAL_EN_GROUPS',
    'CONFLATION_CORRECT_ZH', 'CONFLATION_CORRECT_EN', 'ANTIDOTE_ZH', 'ANTIDOTE_EN', 'PAIR_ZH', 'PAIR_EN',
  ]) assert.ok(k in I, '__internals 缺键: ' + k);
  // [r345] 族表随新家族补全后登记计数同步更新（r336/r344 先例：登记断言随族表
  //   补全翻转，非弱化）——ZH 腿① 4→5（E 连接词族）、EN 腿① 3→4（D 连接词族）、
  //   ZH 腿② 3→4（D dismiss 新尾族）、EN 腿② 5→6（F can-be-dismissed 族）。
  assert.strictEqual(I.MIRROR_ATTR_ZH_GROUPS.length, 5);
  assert.strictEqual(I.MIRROR_ATTR_EN_GROUPS.length, 4);
  assert.strictEqual(I.MIRROR_DENIAL_ZH_GROUPS.length, 4);
  assert.strictEqual(I.MIRROR_DENIAL_EN_GROUPS.length, 6);
  assert.strictEqual(I.ADV_ATTR_ZH_GROUPS.length, 3);   // r343 存量不回归
  assert.strictEqual(I.MORAL_DENIAL_EN_GROUPS.length, 6);
  assert.strictEqual(I.PAIR_ZH, 60);
  assert.strictEqual(I.PAIR_EN, 180);
});

console.log(`\nr344 轮测：${passed} 通过 / ${failed} 失败`);
