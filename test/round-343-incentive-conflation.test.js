'use strict';
/**
 * test/round-343-incentive-conflation.test.js
 * [r343] 逆选择/道德风险归因混淆（incentive conflation）——
 * incentive-blind-spot 模块第 4 子族（模块已由 r297 接进 gate 路径，
 * 第 247 维度 incentive_blind_spot 的九处接入点之一即
 * detectIncentiveBlindSpot；族内加腿自动获得 gate 覆盖，
 * src/index.js 零改动、维度计数 256 不变）。
 * 真升级类型②：已有维度的全新措辞家族。
 *
 * 立项缺口实证（coordination/agent4/probes/r343-probe-candidates.js，
 * 集成树 v6.8.185 hf.gate() 全量 findings 口径）：五候选定拨——
 *   · A 筛查过度诊断（病例激增⇒疾病真的蔓延）2/6、B 均值回归新形
 *     2/6+良性 1/4、C 禀赋效应新措辞 2/6、E 罕见病筛查阳性⇒必然
 *     患病 1/4+良性 2/4，均放弃；
 *   · D 道德风险与逆向选择混淆（理赔上升⇒参保人本来体弱+否认参保
 *     后行为变化）攻击 3/4 穿透、良性 4/4 零误伤 → **胜出**。
 * 海外扫描：空返，按既有形态自建（coordination/agent4/scout/
 * *20261115-020140*：arXiv OR 拆散返回无关条目、GitHub repos 0 命中、
 * Semantic Scholar 429）。
 *
 * 补丁（src/incentive-blind-spot.js 加第四子族）：
 *   腿① ADV_ATTR（参保前风险归因在场）ZH 三组 A/B/C / EN 四组
 *     D/E/F/G；腿② MORAL_DENIAL（道德风险否认/排他）ZH 三组
 *     H/I/J / EN 六组 K/L/M/N/O/P；窗 PAIR_ZH 60 / PAIR_EN 180；
 *   豁免 CONFLATION_CORRECT（两者并重的正确陈述：同时来自/都要
 *     考虑/不能把全部归因；reflects both/separate the two）；
 *   腿②复用既有翻转守卫（不等于/并非/not that）+ 全篇 ANTIDOTE
 *     （防范道德风险/guard against moral hazard）豁免；
 *   分数 0.70/0.78 略高于前三族（0.62/0.72）——攻击句常与前子族
 *     同句共现，略高分保证归因不被 adverse_selection/moral_hazard
 *     截胡。
 *   注册：src/plugins/econ-reasoning-check/index.js FAMILIES（插件层）。
 *
 * 覆盖：A gate 层归因 / B 模块直调+合并入口归因 / C 良性零误伤
 *   （手工 + 官方语料全量）/ D 注册 / E 常量级注入-删条承重
 *   （腿组逐组 + 窗 + 豁免 + 守卫）/ F 边界锁（前三族领地+镜像
 *   归因+概念教学）/ G 登记纪律。
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
  '保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。',
  '赔付率变高证明来投保的本就是体弱多病的人，道德风险根本不存在。',
  'Rising insurance claims prove the insured were already sicker; how they behave after enrolling is irrelevant.',
  'Higher payout rates show adverse selection alone; moral hazard plays no role at all.',
  '投保的人大多本身底子就弱，出险率高跟投保后放纵生活习惯毫无关系。',
  '医保基金支出连年增加，无非是因为参保的本来就是病人群体，参保后的保健行为没有任何变化。',
  'The payouts went up because the people who signed up were already sicker; post-enrollment behavior is irrelevant.',
  'Claims increased simply because policyholders are inherently high-risk; moral hazard can be ruled out.',
];
const ATTACK_ZH = ATTACK.slice(0, 2).concat(ATTACK.slice(4, 6));
const ATTACK_EN = ATTACK.slice(2, 4).concat(ATTACK.slice(6));

// ─── A. gate 层归因 ─────────────────────────────────────────────
check('A gate 层：攻击 8/8 → action≠pass 且 findings 含 incentive_blind_spot', () => {
  for (const s of ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'incentive_blind_spot');
    assert.ok(f, 'findings 缺 incentive_blind_spot: ' + s);
  }
});

// ─── B. 模块直调 ────────────────────────────────────────────────
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

// ─── C. 良性零误伤 ──────────────────────────────────────────────
check('C 良性零误伤：手工良性 8/8 模块级不命中', () => {
  const BENIGN = [
    '理赔上升可能同时来自逆向选择与道德风险，需要分别识别两者的贡献。',
    '参保后行为变化会推高赔付，不能把全部归因于参保前的健康状况。',
    'Rising claims may reflect both adverse selection and moral hazard; separate the two.',
    'Post-enrollment behavior changes can raise payouts; do not attribute everything to prior health.',
    '道德风险问题在保险中普遍存在，需要免赔额来缓解。',
    'Moral hazard is a serious concern in this market.',
    '并不是说参保的人身体差，参保后的行为变化同样推高了赔付。',
    '投保人的健康状况确实影响保费，但免赔额设计正是为了对冲参保后的行为变化。',
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
check('D 注册：插件层 FAMILIES 含 incentive_conflation 行', () => {
  const row = (plugin.FAMILIES || []).find(f => f.key === 'incentive_conflation');
  assert.ok(row, '插件层 FAMILIES 缺行');
  assert.strictEqual(row.mod, '../../incentive-blind-spot.js');
  assert.strictEqual(row.fn, 'detectIncentiveConflation');
  assert.strictEqual(row.round, 'r343');
});
check('D 注册：模块导出 detectIncentiveConflation 且并入 detectIncentiveBlindSpot 子族表', () => {
  assert.strictEqual(typeof detectIncentiveConflation, 'function');
  assert.strictEqual(detectIncentiveConflation('保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。').hit, true);
});

// ─── E. 常量级注入-删条承重 ─────────────────────────────────────
// 腿① ZH 三组逐组删条 → 该组独担样本失效
check('E 注入 ADV_ATTR_ZH_A=[] → A 独担样本失效', () => {
  const s = '投保的人大多本身底子就弱，出险率高跟投保后放纵生活习惯毫无关系。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { ADV_ATTR_ZH_A: [] }), false);
});
check('E 注入 ADV_ATTR_ZH_B=[] → B 独担样本失效', () => {
  const s = '赔付率变高证明来投保的本就是体弱多病的人，道德风险根本不存在。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { ADV_ATTR_ZH_B: [] }), false);
});
check('E 注入 ADV_ATTR_ZH_C=[] → C 独担样本失效', () => {
  const s = '参保的属于体弱群体，道德风险问题在此不存在。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { ADV_ATTR_ZH_C: [] }), false);
});
// 腿① EN 四组逐组删条
check('E 注入 ADV_ATTR_EN_D=[] → D 独担样本失效', () => {
  const s = 'Rising insurance claims prove the insured were already sicker; moral hazard plays no role at all.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { ADV_ATTR_EN_D: [] }), false);
});
check('E 注入 ADV_ATTR_EN_E=[] → E 独担样本失效', () => {
  const s = 'The data show people who buy insurance are already less healthy, and moral hazard is not a factor.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { ADV_ATTR_EN_E: [] }), false);
});
check('E 注入 ADV_ATTR_EN_F=[] → F 独担样本失效', () => {
  const s = 'Higher payout rates show adverse selection alone; moral hazard plays no role at all.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { ADV_ATTR_EN_F: [] }), false);
});
check('E 注入 ADV_ATTR_EN_G=[] → G 独担样本失效', () => {
  const s = 'The payouts went up because the people who signed up were already sicker; post-enrollment behavior is irrelevant.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { ADV_ATTR_EN_G: [] }), false);
});
// 腿② ZH 三组逐组删条
check('E 注入 MORAL_DENIAL_ZH_H=[] → H 独担样本失效', () => {
  const s = '保险理赔连年上升说明参保的人本来身体就差，道德风险根本不存在。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MORAL_DENIAL_ZH_H: [] }), false);
});
check('E 注入 MORAL_DENIAL_ZH_I=[] → I 独担样本失效', () => {
  const s = '保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MORAL_DENIAL_ZH_I: [] }), false);
});
check('E 注入 MORAL_DENIAL_ZH_J=[] → J 独担样本失效', () => {
  const s = '医保基金支出连年增加，无非是因为参保的本来就是病人群体，参保后的保健行为没有任何变化。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MORAL_DENIAL_ZH_J: [] }), false);
});
// 腿② EN 六组逐组删条
check('E 注入 MORAL_DENIAL_EN_K=[] → K 独担样本失效', () => {
  const s = 'Rising insurance claims prove the insured were already sicker; moral hazard plays no role at all.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MORAL_DENIAL_EN_K: [] }), false);
});
check('E 注入 MORAL_DENIAL_EN_L=[] → L 独担样本失效', () => {
  const s = 'The data show people who buy insurance are already less healthy, and moral hazard is not a factor.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MORAL_DENIAL_EN_L: [] }), false);
});
check('E 注入 MORAL_DENIAL_EN_M=[] → M 独担样本失效', () => {
  const s = 'Claims increased simply because policyholders are inherently high-risk; moral hazard can be ruled out.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MORAL_DENIAL_EN_M: [] }), false);
});
check('E 注入 MORAL_DENIAL_EN_N=[] → N 独担样本失效', () => {
  const s = 'The payouts went up because the people who signed up were already sicker; post-enrollment behavior is irrelevant.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MORAL_DENIAL_EN_N: [] }), false);
});
check('E 注入 MORAL_DENIAL_EN_O=[] → O 独担样本失效', () => {
  const s = 'The payouts went up because the people who signed up were already sicker; moral hazard has nothing to do with how they behave.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MORAL_DENIAL_EN_O: [] }), false);
});
check('E 注入 MORAL_DENIAL_EN_P=[] → P 独担样本失效', () => {
  const s = 'Claims rose because the insured were already sicker; it has nothing to do with post-enrollment behavior.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MORAL_DENIAL_EN_P: [] }), false);
});
// 整表删条
check('E 注入 ADV_ATTR_ZH=[] → 中文攻击全失效', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { ADV_ATTR_ZH: [] }), false, '删腿①后仍命中: ' + s);
});
check('E 注入 MORAL_DENIAL_ZH=[] → 中文攻击全失效', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { MORAL_DENIAL_ZH: [] }), false, '删腿②后仍命中: ' + s);
});
check('E 注入 ADV_ATTR_EN=[] → 英文攻击全失效', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { ADV_ATTR_EN: [] }), false, '删腿①后仍命中: ' + s);
});
check('E 注入 MORAL_DENIAL_EN=[] → 英文攻击全失效', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { MORAL_DENIAL_EN: [] }), false, '删腿②后仍命中: ' + s);
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
  const s = '赔付上升可能同时来自两种机制，不能把全部归因于参保前：参保的人本来身体就差，道德风险根本不存在。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONFLATION_CORRECT_ZH: FALSE }), true);
});
check('E 注入 CONFLATION_CORRECT_EN 永假 → 两者并重良性变红', () => {
  const s = 'Rising claims reflect both mechanisms — do not attribute everything to prior health: the insured were already sicker, and moral hazard plays no role.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONFLATION_CORRECT_EN: FALSE }), true);
});
check('E 注入 ANTIDOTE_ZH 永假 → 防范表述+攻击结构良性变红', () => {
  const s = '防范道德风险很重要：保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { ANTIDOTE_ZH: FALSE }), true);
});
check('E 注入 ANTIDOTE_EN 永假 → guard 表述+攻击结构良性变红', () => {
  const s = 'Guard against moral hazard: rising claims prove the insured were already sicker, and how they behave after enrolling is irrelevant.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { ANTIDOTE_EN: FALSE }), true);
});
// 翻转守卫（腿②前置翻转短语 → 不计；与前三子族同口径，守卫只挂在腿②）
check('E 翻转守卫：腿②前置「不是说」→ 不判', () => {
  const s = '保险理赔金额连年上升，参保的人本来身体就差，并不是说跟参保后疏于保健没有关系。';
  assert.strictEqual(hit(s), false);
});
check('E 翻转守卫：腿②前置「not that」→ 不判', () => {
  const s = 'Rising claims do not mean the insured were already sicker; it is not that how they behave after enrolling is irrelevant.';
  assert.strictEqual(hit(s), false);
});
// 族独立性：本族四张常量表全清 → 攻击全失效
check('E 族独立性：本族腿组全清 → 攻击 8/8 失效', () => {
  const inj = {
    ADV_ATTR_ZH: [], ADV_ATTR_EN: [], MORAL_DENIAL_ZH: [], MORAL_DENIAL_EN: [],
  };
  for (const s of ATTACK) assert.strictEqual(hit(s, inj), false, '清空后仍命中: ' + s);
});

// ─── F. 边界锁（前三子族领地与相关形不判）──────────────────────
check('F 边界：adverse_selection 攻击句不判（无道德风险否认腿）', () => {
  assert.strictEqual(hit('保险池自然会同时吸引低风险和高风险的人，这对保费没有影响。'), false);
});
check('F 边界：moral_hazard 攻击句不判（无参保前归因腿）', () => {
  assert.strictEqual(hit('买了全险之后司机开车就不谨慎了，这对事故率没有影响。'), false);
});
check('F 边界：free_rider 攻击句不判', () => {
  assert.strictEqual(hit('公共事务总会有人站出来管，我个人不用参与。'), false);
});
check('F 边界：只腿①（参保归因在场、无道德风险否认）不判', () => {
  assert.strictEqual(hit('保险理赔金额连年上升，说明参保的人本来身体就差。'), false);
});
check('F 边界：只腿②（参保前否认、无参保后归因）不判', () => {
  // r344 起补镜像形单腿边界：原「保险公司理赔上升是因为道德风险问题，跟参保的
  // 人本身健康状况没有关系」样本正是镜像归因混淆，已移至 round-344 轮测登记。
  assert.strictEqual(hit('投保前的风险构成对理赔根本没有影响。'), false);
});
check('F 边界：镜像归因混淆（全部归因道德风险、抹掉逆选择）r344 起判', () => {
  // r344 镜像腿组落地（MIRROR_ATTR×MIRROR_DENIAL），本条边界锁随之翻转，
  // 同族反向形现在承重——登记见 round-344-mirror-conflation.test.js。
  assert.strictEqual(hit('理赔上升全是道德风险造成的，逆选择根本不存在。'), true);
});
check('F 边界：概念教学句不判', () => {
  assert.strictEqual(hit('道德风险是指参保后行为变化导致赔付上升的现象，与逆选择是两种不同机制。'), false);
});

// ─── G. 登记纪律 ─────────────────────────────────────────────────
check('G 登记：__internals 暴露本族常量组、GROUPS 与窗', () => {
  const I = __internals();
  for (const k of [
    'ADV_ATTR_ZH', 'ADV_ATTR_EN', 'MORAL_DENIAL_ZH', 'MORAL_DENIAL_EN',
    'CONFLATION_CORRECT_ZH', 'CONFLATION_CORRECT_EN',
    'ADV_ATTR_ZH_GROUPS', 'ADV_ATTR_EN_GROUPS', 'MORAL_DENIAL_ZH_GROUPS', 'MORAL_DENIAL_EN_GROUPS',
    'ANTIDOTE_ZH', 'ANTIDOTE_EN', 'PAIR_ZH', 'PAIR_EN',
  ]) assert.ok(k in I, '__internals 缺键: ' + k);
  assert.strictEqual(I.ADV_ATTR_ZH_GROUPS.length, 3);
  assert.strictEqual(I.ADV_ATTR_EN_GROUPS.length, 4);
  assert.strictEqual(I.MORAL_DENIAL_ZH_GROUPS.length, 3);
  assert.strictEqual(I.MORAL_DENIAL_EN_GROUPS.length, 6);
  assert.strictEqual(I.PAIR_ZH, 60);
  assert.strictEqual(I.PAIR_EN, 180);
});

console.log(`\nr343 轮测：${passed} 通过 / ${failed} 失败`);
