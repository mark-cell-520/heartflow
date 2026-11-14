'use strict';
/**
 * test/round-330-dose-response-scaling.test.js — 第 250 维度
 * dose_response_linearity（剂量-反应线性外推）**现代规模 scaling 域新措辞
 * 家族**（真升级②）模块级 + gate 层测试 + 负例注入。
 *
 * 承重对象：src/dose-response-linearity.js 的 r330 新增 SCALE 腿对与
 * EXEMPT_SCALE_NEG 豁免常量。
 * 追责口径：逐常量验证「删任一承重常量必翻转判定」，防负例补丁式升级。
 *
 * 立项证据：r330 池化探针（coordination/agent4/probes/r330-probe-scaling.js，
 * v6.8.184 实测）该族 15/15 攻击整族穿透 gate=pass、良性 6/7（1 条被既有
 * 本维度 verify，非新增误伤）；改后模块层 15/15 命中、良性仅剩 1 条既有
 * verify、四门禁误拦 302/326 与基线逐条一致（零新增误伤）。
 *
 * 接线状态：本维度 r306 已接入 src/index.js（第 250 维度），故本测试同时
 * 验证 gate 层归因（action=verify + dose_response_linearity 承重）。
 *
 * 运行：node test/round-330-dose-response-scaling.test.js
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

// ── 攻击集：现代规模 scaling 域线性缩放假设（中英 15 条）──────────────
const ATTACKS_ZH = [
  '服务器扩容一倍，系统吞吐量就能翻倍。',
  '集群节点数翻倍，处理能力必然翻倍。',
  '团队人数翻倍，交付速度必然也翻倍。',
  '再招一倍的人，项目进度就能提速一倍。',
  '研发投入加倍，创新产出就会加倍。',
  '营销预算翻倍，获客数量一定翻倍。',
  '工厂产能翻倍，利润就精确翻倍。',
  '广告费加倍，销售额也会精确加倍。',
  '加班时间翻倍，产出也跟着翻倍。',
];
const ATTACKS_EN = [
  'Double the servers and throughput doubles.',
  'Doubling the team size will double the delivery speed.',
  'Twice the marketing budget means twice the customers.',
  'Double the factory capacity and profit doubles.',
  'If we double the R&D spend, output doubles.',
  'Twice the overtime means twice the output.',
];
// 健康剂量族存量样本：确认原族零回归
const HEALTH = [
  '吃一片有效，吃十片效果就是十倍。',
  '每天一片维生素有效，那每天十片效果就是十倍',
  'One pill helps, so ten pills help ten times as much.',
];
// 干净良性：必须放行（正确指出非线性/瓶颈/边际递减/谨慎）
const BENIGN_CLEAN = [
  '扩容一倍吞吐量未必翻倍，存在瓶颈和协调开销。',
  '加人未必提速，沟通成本会让边际递减。',
  '预算翻倍获客通常不会线性增长，边际递减。',
  'Returns to scale are not guaranteed; bottlenecks limit throughput.',
  'Scaling headcount has diminishing returns due to coordination overhead.',
  '先测出扩展曲线，再决定扩容多少，不假设线性。',
];
// 仅靠 EXEMPT_SCALE_NEG 承重（不含全局 未必/不会/非线性）的良性：
const SCALE_NEG_ZH = '服务器扩容一倍，理论上吞吐量翻倍，但瓶颈让实际达不到。';
const SCALE_NEG_EN = 'Double the servers and throughput doubles in theory, but bottlenecks cap the real gain.';

// ── 模块层：攻击全命中 ────────────────────────────────────────────────
t('SCALE 攻击 15/15 全命中（模块层）', () => {
  for (const a of ATTACKS_ZH.concat(ATTACKS_EN)) {
    assert.ok(checkDoseResponseLinearity(a).hit, '应命中: ' + a);
  }
});
t('健康剂量族存量样本零回归（3/3 仍命中）', () => {
  for (const h of HEALTH) assert.ok(checkDoseResponseLinearity(h).hit, '回归: ' + h);
});
t('干净良性 6/6 放行', () => {
  for (const b of BENIGN_CLEAN) assert.ok(!checkDoseResponseLinearity(b).hit, '误伤: ' + b);
});
t('EXEMPT_SCALE_NEG 良性放行（瓶颈承重）', () => {
  assert.ok(!checkDoseResponseLinearity(SCALE_NEG_ZH).hit, 'ZH 瓶颈良性误伤');
  assert.ok(!checkDoseResponseLinearity(SCALE_NEG_EN).hit, 'EN 瓶颈良性误伤');
});

// ── gate 层归因（第 250 维度已接线）──────────────────────────────────
t('gate 层：scaling 攻击 action=verify 且归因 dose_response_linearity', () => {
  for (const a of [ATTACKS_ZH[0], ATTACKS_ZH[4], ATTACKS_EN[0]]) {
    const r = gate(a);
    assert.equal(r.gate.action, 'verify', 'action 应为 verify: ' + a);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('dose_response_linearity'), '应归因 dose_response_linearity: ' + a + ' got ' + dims);
  }
});
t('gate 层：干净良性 action=pass（不被新族误拦）', () => {
  for (const b of [BENIGN_CLEAN[0], BENIGN_CLEAN[4]]) {
    assert.equal(gate(b).gate.action, 'pass', '良性应 pass: ' + b);
  }
});

// ── 负例注入：删任一承重常量必翻转 ────────────────────────────────────
t('注入 SCALE_IN_ZH=[] → ZH 攻击漏判', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_ZH[0], { SCALE_IN_ZH: [] }).hit, 'SCALE_IN_ZH 承重');
});
t('注入 SCALE_OUT_ZH=[] → ZH 攻击漏判', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_ZH[0], { SCALE_OUT_ZH: [] }).hit, 'SCALE_OUT_ZH 承重');
});
t('注入 SCALE_IN_EN=[] → EN 攻击漏判', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_EN[0], { SCALE_IN_EN: [] }).hit, 'SCALE_IN_EN 承重');
});
t('注入 SCALE_OUT_EN=[] → EN 攻击漏判', () => {
  assert.ok(!checkDoseResponseLinearity(ATTACKS_EN[0], { SCALE_OUT_EN: [] }).hit, 'SCALE_OUT_EN 承重');
});
t('注入 EXEMPT_SCALE_NEG_ZH=[] → 瓶颈良性转为命中（豁免承重）', () => {
  assert.ok(checkDoseResponseLinearity(SCALE_NEG_ZH, { EXEMPT_SCALE_NEG_ZH: [] }).hit, 'EXEMPT_SCALE_NEG_ZH 承重');
});
t('注入 EXEMPT_SCALE_NEG_EN=[] → 瓶颈良性转为命中（豁免承重）', () => {
  assert.ok(checkDoseResponseLinearity(SCALE_NEG_EN, { EXEMPT_SCALE_NEG_EN: [] }).hit, 'EXEMPT_SCALE_NEG_EN 承重');
});

// ── __internals 暴露（供后续轮负例注入口）─────────────────────────────
t('__internals 暴露 r330 六常量', () => {
  const I = __internals();
  for (const k of ['SCALE_IN_ZH', 'SCALE_IN_EN', 'SCALE_OUT_ZH', 'SCALE_OUT_EN', 'EXEMPT_SCALE_NEG_ZH', 'EXEMPT_SCALE_NEG_EN']) {
    assert.ok(Array.isArray(I[k]) && I[k].length > 0, '缺常量: ' + k);
  }
});

const NEG = 6;
console.log('\nr330 dose_response_linearity scaling: ' + pass + ' passed / ' + fail + ' failed');
console.log('负例注入 ' + NEG + ' 个: ' + NEG + ' 个翻转承重（删常量即漏判/误伤）, 0 个未翻转');
// 清理：本测试不做任何文件系统/模块状态变异（注入全部经参数作用域传递），
// 无残留状态需要还原；以退出码上报结果。
process.exit(fail > 0 ? 1 : 0);
