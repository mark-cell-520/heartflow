'use strict';
/**
 * test/round-341-daily-item-dose-extrapolation.test.js — 第 250 维度
 * dose_response_linearity（剂量-反应线性外推）**日常物品剂量外推族**
 * （真升级②）模块级 + gate 层测试 + 负例注入 + 升级判定承重。
 *
 * 承重对象：src/dose-response-linearity.js 的 r341 新增 DAILY_IN /
 * TASK_AMP 四常量与 hasDailyEscalation 剂量升级判定。
 * 追责口径：逐常量验证「删任一承重常量必翻转判定」，防负例补丁式升级；
 * 升级判定用「配对样本」证明承重（去掉小剂量句 → 单剂量良性不判）。
 *
 * 立项证据：r341 立项探针（coordination/agent4/probes/
 * r341-probe-candidates.js，v6.8.185 pristine 实测）该族攻击 9/10
 * 穿透 gate=pass、良性 6/6 零误伤（1 条 EN 样本被存量 dehumanization
 * 代拦系 "fuel" 一词基线怪癖，换措辞后仍穿透）；改后 10/10 命中。
 * 同轮探针另三候选（平均数误读/检测准确率⇒患病概率/时间贴现）均被
 * 存量维度覆盖过半，放弃。
 *
 * 接线状态：本维度 r306 已接入 src/index.js（第 250 维度），故本测试
 * 同时验证 gate 层归因（action=verify + dose_response_linearity 承重）。
 *
 * 运行：node test/round-341-daily-item-dose-extrapolation.test.js
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { checkDoseResponseLinearity, __internals } = require(path.join(ROOT, 'src', 'dose-response-linearity.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ── 攻击集：日常物品剂量外推（中英 10 条，探针穿透样本原样收编）─────────
const ATTACKS_ZH = [
  '每天喝一杯咖啡能提神，喝到十杯就能连续通宵不困。',
  '一勺糖下肚能量满满，加到十勺跑完马拉松都不成问题。',
  '庄稼施一瓶肥长得好，加到十瓶肯定大丰收。',
  '每顿吃一碗饭有力气，吃十碗更能扛百斤走十里。',
  '睡前看一小时手机助眠，看十个小时更能进入深度休息。',
];
const ATTACKS_EN = [
  'One cup of coffee sharpens focus, so ten cups will keep you up all week.',
  'A spoonful of sugar gives energy; ten spoonfuls will power a whole marathon.',
  'One bottle of fertilizer makes the crop thrive, so ten bottles guarantee a harvest.',
  'A bowl of rice per meal gives strength; ten bowls will let you carry a hundred jin.',
  'An hour of screen time before bed relaxes you; ten hours will deepen the rest.',
];
// 同族变体（能力标记/极端任务的同义形，两序结构各覆盖）
const VARIANTS_ZH = [
  '两杯咖啡下肚精神抖擞，加到十杯准能熬个通宵。',
  '一颗奶糖就能甜一下午，吃上十颗必然开心到彻夜不眠。',
  '一袋肥料就让菜地精神，翻到十袋保证亩产万斤。',
];
const VARIANTS_EN = [
  'Two cups of tea calm you down; ten cups will knock you out all night.',
  'One scoop of protein powder builds muscle; ten scoops will turn you into a superhero.',
  'A single glass of juice refreshes you; ten glasses will let you run a hundred miles.',
];

// ── 良性集：必须放行 ──────────────────────────────────────────────────
const BENIGN_CLEAN = [
  // 正确指出非线性/平台期/过量有害（全局推理否定豁免承重）
  '咖啡因提神效果有平台期，喝到十杯只会心慌失眠，不会更清醒。',
  '肥料加倍可能烧苗，剂量与收成不是线性关系，要做田间试验。',
  '糖提供的能量受血糖调节限制，加量不会同比例延长耐力。',
  'Caffeine has a ceiling effect; ten cups cause jitters, not more alertness.',
  'Doubling fertilizer can burn the crops; yield does not scale linearly.',
  'Energy from sugar is regulated by blood glucose; more spoons do not proportionally extend endurance.',
  // 升级判定承重：单剂量良性（「八小时」只有一处数量，无升级对）
  '保持规律作息，睡够八小时更能进入深度休息。',
  '每天喝八杯水有益健康。',
  '每顿一碗饭有力气，干活更有劲。',
  // 谚语/俗语（无极端任务形）
  '一天一个苹果，医生远离我。',
  '饭后百步走，活到九十九。',
  // 实验/证据语境（全局证据豁免承重）
  '研究表明每天两杯咖啡可降低心血管疾病风险。',
  'A randomized trial found that two servings of fruit a day reduce risk.',
];
// 升级判定配对样本：删掉小剂量分句后同一断言必须落回 pass
const PAIR_SMALL_DOSE = '睡前看一小时手机助眠，';
const PAIR_FULL = '睡前看一小时手机助眠，看十个小时更能进入深度休息。';
const PAIR_NO_ESCALATION = '看十个小时更能进入深度休息。';

// 存量家族回归样本（r306 健康剂量族 / r330 规模族）
const HEALTH_REGRESSION = [
  '吃一片有效，吃十片效果就是十倍。',
  'One pill helps, so ten pills help ten times as much.',
];
const SCALE_REGRESSION = [
  '服务器扩容一倍，系统吞吐量就能翻倍。',
  'Double the servers and throughput doubles.',
];

// ── 模块层：攻击全命中 ────────────────────────────────────────────────
t('族三攻击 10/10 全命中（模块层）', () => {
  for (const a of ATTACKS_ZH.concat(ATTACKS_EN)) {
    assert.ok(checkDoseResponseLinearity(a).hit, '应命中: ' + a);
  }
});
t('同族变体 6/6 全命中（模块层）', () => {
  for (const a of VARIANTS_ZH.concat(VARIANTS_EN)) {
    assert.ok(checkDoseResponseLinearity(a).hit, '应变体命中: ' + a);
  }
});
t('存量家族零回归（健康族 2/2 + 规模族 2/2 仍命中）', () => {
  for (const h of HEALTH_REGRESSION) assert.ok(checkDoseResponseLinearity(h).hit, '健康族回归: ' + h);
  for (const s of SCALE_REGRESSION) assert.ok(checkDoseResponseLinearity(s).hit, '规模族回归: ' + s);
});
t('干净良性 14/14 放行', () => {
  for (const b of BENIGN_CLEAN) assert.ok(!checkDoseResponseLinearity(b).hit, '误伤: ' + b);
});

// ── 族三判定独立性：新腿对整体关闭后攻击样本必须落回 pass ─────────────
t('族三独立性：DAILY_IN/TASK_AMP 四常量全空 → 攻击样本不再命中', () => {
  const off = { DAILY_IN_ZH: [], DAILY_IN_EN: [], TASK_AMP_ZH: [], TASK_AMP_EN: [] };
  for (const a of ATTACKS_ZH.concat(ATTACKS_EN)) {
    assert.ok(!checkDoseResponseLinearity(a, off).hit, '应由族三独有判定: ' + a);
  }
});

// ── 升级判定承重（配对样本证明，非恒真删除点）────────────────────────
t('升级判定：配对全句命中、去小剂量句后落回 pass', () => {
  assert.ok(checkDoseResponseLinearity(PAIR_FULL).hit, '全句应命中');
  assert.ok(!checkDoseResponseLinearity(PAIR_SMALL_DOSE).hit, '仅小剂量句不应命中');
  assert.ok(!checkDoseResponseLinearity(PAIR_NO_ESCALATION).hit, '去掉小剂量分句（无升级对）不应命中');
});
t('升级判定：hasDailyEscalation 对攻击 true、对单剂量良性 false', () => {
  const I = __internals();
  assert.equal(I.hasDailyEscalation(ATTACKS_ZH[0]), true, 'ZH 攻击应有升级对');
  assert.equal(I.hasDailyEscalation(ATTACKS_EN[0]), true, 'EN 攻击应有升级对');
  assert.equal(I.hasDailyEscalation('保持规律作息，睡够八小时更能进入深度休息。'), false, '单剂量良性不应有升级对');
  assert.equal(I.hasDailyEscalation(PAIR_NO_ESCALATION), false, '无升级对');
});
t('单位归一：glasses/bottles/个小时与单数同键', () => {
  const I = __internals();
  assert.equal(I.normUnit('bottles'), 'bottle');
  assert.equal(I.normUnit('glasses'), 'glass');
  assert.equal(I.normUnit('cups'), 'cup');
  assert.equal(I.normUnit('个小时'), '小时');
  assert.equal(I.numVal('十'), 10);
  assert.equal(I.numVal('十二'), 12);
  assert.equal(I.numVal('二十'), 20);
  assert.equal(I.numVal('一百'), 100);
  assert.equal(I.numVal('两'), 2);
  assert.equal(I.numVal('half'), 0.5);
});

// ── gate 层归因（第 250 维度已接线）──────────────────────────────────
t('gate 层：族三攻击 action=verify 且归因 dose_response_linearity', () => {
  for (const a of [ATTACKS_ZH[1], ATTACKS_ZH[3], ATTACKS_EN[2], ATTACKS_EN[4]]) {
    const r = gate(a);
    assert.equal(r.gate.action, 'verify', 'action 应为 verify: ' + a);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('dose_response_linearity'), '应归因 dose_response_linearity: ' + a + ' got ' + dims);
  }
});
t('gate 层：干净良性 action=pass（不被新族误拦）', () => {
  for (const b of [BENIGN_CLEAN[6], BENIGN_CLEAN[9], BENIGN_CLEAN[12]]) {
    assert.equal(gate(b).gate.action, 'pass', '良性应 pass: ' + b);
  }
});

// ── 负例注入：删任一承重常量必翻转 ────────────────────────────────────
t('注入 DAILY_IN_ZH=[] → ZH 攻击漏判', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_ZH[1], { DAILY_IN_ZH: [] }).hit, 'DAILY_IN_ZH 承重');
});
t('注入 TASK_AMP_ZH=[] → ZH 攻击漏判', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_ZH[1], { TASK_AMP_ZH: [] }).hit, 'TASK_AMP_ZH 承重');
});
t('注入 DAILY_IN_EN=[] → EN 攻击漏判', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_EN[2], { DAILY_IN_EN: [] }).hit, 'DAILY_IN_EN 承重');
});
t('注入 TASK_AMP_EN=[] → EN 攻击漏判', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_EN[2], { TASK_AMP_EN: [] }).hit, 'TASK_AMP_EN 承重');
});

// ── __internals 暴露（供后续轮负例注入口）─────────────────────────────
t('__internals 暴露 r341 四常量 + 三函数', () => {
  const I = __internals();
  for (const k of ['DAILY_IN_ZH', 'DAILY_IN_EN', 'TASK_AMP_ZH', 'TASK_AMP_EN']) {
    assert.ok(Array.isArray(I[k]) && I[k].length > 0, '缺常量: ' + k);
  }
  for (const k of ['hasDailyEscalation', 'numVal', 'normUnit']) {
    assert.equal(typeof I[k], 'function', '缺函数: ' + k);
  }
});

const NEG = 4;
console.log('\nr341 dose_response_linearity daily-item: ' + pass + ' passed / ' + fail + ' failed');
console.log('负例注入 ' + NEG + ' 个: ' + NEG + ' 个翻转承重（删常量即漏判）, 0 个未翻转');
// 清理：本测试不做任何文件系统/模块状态变异（注入全部经参数作用域传递），
// 无残留状态需要还原；以退出码上报结果。
process.exit(fail > 0 ? 1 : 0);
