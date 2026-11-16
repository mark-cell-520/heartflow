'use strict';
/**
 * test/round-336-dose-response-daily.test.js — 第 250 维度
 * dose_response_linearity（剂量-反应线性外推）**日常物品剂量外推族新措辞
 * 家族**（真升级②：已有维度的全新句式族）模块级 + gate 层测试 + 负例注入。
 *
 * 承重对象：src/dose-response-linearity.js 的 r336 新增族三常量对：
 *   DAILY_IN_ZH/EN（腿① 日常物品 × 数量/增量）+
 *   GAIN_ZH/EN（腿② 数量/增量 × 因果连接词 × 状态获益）+
 *   QUANT_ZH/EN（第三条件：全文剂量表达计数）+
 *   EXEMPT_DAILY_ZH/EN（族三专属推理否定）
 * 追责口径：逐常量验证「删任一承重常量必翻转判定」，防负例补丁式升级。
 *
 * 立项证据：r336 池化探针（scripts/round-336/probe-gap.js，v6.8.186 实测）
 * 日常物品剂量外推族 7/10 攻击穿透 gate=pass（A1/A5/A6/A7 中文 +
 * A8/A9/A10 英文），良性 5/6 pass（1 条被既有维度 verify，非本轮引入）。
 * 改后模块层 10/10 命中、良性零新增误伤。
 *
 * 与既有两族的关系（三条件判据的必要性）：
 *   族一 r306 健康剂量：腿①要求「数词+量词」紧邻摄入动词（「吃十片」），
 *     腿②要求显式倍数词（「十倍」）——「多喝点更养生」两腿都不命中；
 *   族二 r330 scaling：腿①为工程/经营投入名词（服务器/预算/产能），
 *     腿②为工程产出名词（吞吐/交付/利润）——与日常饮食物零交叉；
 *   族三 r336：腿①日常饮食物/日常活动 × 模糊量，腿②获益状态词
 *     （养生/精神/通宵不困/all-day energy），第三条件要求全文 ≥2 个
 *     剂量表达或含显式增量词，防「每天跑步半小时更健康」单剂量误伤。
 *
 * 运行：node test/round-336-dose-response-daily.test.js
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

// ── 攻击集：日常物品剂量外推族（中英 10 条 = 探针穿透集）────────────────
const ATTACKS_ZH = [
  '喝一杯咖啡能提神，那喝十杯就能通宵不困。',
  '一杯茶能润喉，多喝几杯更能养生。',
  '每天一片维生素有用，那每天十片效果就是十倍。',
  '喝一杯酒活血，那多喝点更养生。',
  '一颗糖能补充能量，吃一把糖能精神一整天。',
  '他每天跑步半小时身体好，所以每天跑十二小时更健康。',
  '喝一杯咖啡提神，多喝几杯更能提神醒脑。',
  '一杯茶能润喉，多喝几杯更健康。',
  '他每天跑步半小时身体好，所以每天跑十二小时更健康。',
  '一颗糖能补充能量，吃一把糖能精神一整天。',
];
const ATTACKS_EN = [
  'One cup of coffee keeps you awake, so ten cups keep you up all night and make you sharper.',
  'A handful of candy gives more energy than one piece.',
  'More coffee means more energy and better focus all day.',
  'One glass of wine relaxes you, so more wine relaxes you more.',
  'A few more cups of tea are better for your health.',
];
// 健康剂量族存量样本（族一回归）
const HEALTH = [
  '吃一片有效，吃十片效果就是十倍。',
  '每天一片维生素有效，那每天十片效果就是十倍',
  'One pill helps, so ten pills help ten times as much.',
];
// scaling 族存量样本（族二回归）
const SCALE = [
  '服务器扩容一倍，系统吞吐量就能翻倍。',
  'Double the servers and throughput doubles.',
];
// 干净良性：必须放行（正确指出节制/无安全量/单剂量正确陈述/对冲）
const BENIGN_CLEAN = [
  '每天跑步半小时更健康，这是适度运动。',
  '每天喝一杯咖啡能提神，但喝太多反而心慌失眠。',
  '茶多喝几杯没关系，但也别过量，适度就好。',
  '咖啡有安全剂量上限，喝多了心悸失眠。',
  'Drinking coffee in moderation is fine.',
  'Too much caffeine can be harmful; stick to one or two cups.',
  '每天跑步半小时更健康。',
  '他每天跑步半小时身体好。',
  'One cup of coffee in the morning is a healthy habit.',
];
// 仅靠 EXEMPT_DAILY 承重（双腿齐全、仅豁免词救回；不含全局 过量/不会/未必）：
// ZH：腿②「更能 + 提神醒脑」齐全，唯一豁免来源是「节制」（EXEMPT_DAILY_ZH）
const DAILY_NEG_ZH = '多喝几杯咖啡更能提神醒脑，不过凡事要节制。';
// EN：腿①+腿②齐全，唯一豁免来源是「overconsumption」（EXEMPT_DAILY_EN），
// 不含全局豁免词（not linear/toxic/not necessarily 等均不出现）
const DAILY_NEG_EN = 'A handful of candy gives all-day energy, though overconsumption is the real problem.';

// ── 模块层：攻击全命中 ────────────────────────────────────────────────
t('族三攻击 10/10 全命中（模块层）', () => {
  for (const a of ATTACKS_ZH.concat(ATTACKS_EN)) {
    assert.ok(checkDoseResponseLinearity(a).hit, '应命中: ' + a);
  }
});

// ── 模块层：存量两族零回归 ─────────────────────────────────────────────
t('族一健康剂量 3/3 回归', () => {
  for (const h of HEALTH) assert.ok(checkDoseResponseLinearity(h).hit, '回归: ' + h);
});
t('族二 scaling 2/2 回归', () => {
  for (const s of SCALE) assert.ok(checkDoseResponseLinearity(s).hit, '回归: ' + s);
});

// ── 模块层：良性零误伤 ────────────────────────────────────────────────
t('良性 9/9 放行（含单剂量正确陈述/边缘良性）', () => {
  for (const b of BENIGN_CLEAN) {
    assert.ok(!checkDoseResponseLinearity(b).hit, '误伤: ' + b);
  }
});

// ── 模块层：族三专属推理否定 ─────────────────────────────────────────
t('EXEMPT_DAILY 专属豁免承重', () => {
  assert.ok(!checkDoseResponseLinearity(DAILY_NEG_ZH).hit, 'ZH 节制良性误伤');
  assert.ok(!checkDoseResponseLinearity(DAILY_NEG_EN).hit, 'EN moderation 良性误伤');
});

// ── 模块层：逐常量注入（删任一承重常量必翻转）────────────────────────
// 注意：族三与族四（r341 TASK_AMP）是 OR 并联，同一攻击样本可被两族同时命中。
// 因此证明「族三独有承重」时，必须同时关掉族四腿，否则族四会兜底（r337 修正）。
const FAM4_OFF = { TASK_AMP_ZH: [], TASK_AMP_EN: [] };
t('DAILY_IN_ZH 承重（注入空数组后翻转）', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_ZH[0], Object.assign({ DAILY_IN_ZH: [] }, FAM4_OFF)).hit, 'DAILY_IN_ZH');
});
t('GAIN_ZH 承重（注入空数组后翻转）', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_ZH[0], Object.assign({ GAIN_ZH: [] }, FAM4_OFF)).hit, 'GAIN_ZH');
});
t('QUANT_ZH 承重（注入空数组后翻转）', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_ZH[0], Object.assign({ QUANT_ZH: [] }, FAM4_OFF)).hit, 'QUANT_ZH');
});
t('DAILY_IN_EN 承重（注入空数组后翻转）', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_EN[0], Object.assign({ DAILY_IN_EN: [] }, FAM4_OFF)).hit, 'DAILY_IN_EN');
});
t('GAIN_EN 承重（注入空数组后翻转）', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_EN[0], Object.assign({ GAIN_EN: [] }, FAM4_OFF)).hit, 'GAIN_EN');
});
t('QUANT_EN 承重（注入空数组后翻转）', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_EN[0], { QUANT_EN: [] }).hit, 'QUANT_EN');
});
t('EXEMPT_DAILY_ZH 承重（注入空数组后翻转）', () => {
  assert.ok(checkDoseResponseLinearity(DAILY_NEG_ZH, { EXEMPT_DAILY_ZH: [] }).hit, 'EXEMPT_DAILY_ZH');
});
t('EXEMPT_DAILY_EN 承重（注入空数组后翻转）', () => {
  assert.ok(checkDoseResponseLinearity(DAILY_NEG_EN, { EXEMPT_DAILY_EN: [] }).hit, 'EXEMPT_DAILY_EN');
});

// ── gate 层：归因验证（action 非 pass 且 dose_response_linearity 承重）──
t('gate 层攻击 10/10 非 pass', () => {
  for (const a of ATTACKS_ZH.concat(ATTACKS_EN)) {
    const g = gate(a);
    assert.notStrictEqual(g.gate.action, 'pass', 'gate.action=pass 漏判: ' + a);
  }
});
t('gate 层良性 9/9 pass', () => {
  for (const b of BENIGN_CLEAN) {
    const g = gate(b);
    assert.strictEqual(g.gate.action, 'pass', '良性被拦 action=' + g.gate.action + ': ' + b);
  }
});

console.log('\n第 250 维度 dose_response_linearity r336 日常物品剂量外推族测试：' + pass + ' passed / ' + fail + ' failed');
if (fail > 0) process.exit(1);
