'use strict';
/**
 * test/round-263-statistical-misleading.test.js
 * [r263] statistical_misleading（第 58 维度）「成」数比例 × 模糊小基数
 * 全新措辞家族扩展（真升级②，live 生效，维度计数 229 不变，
 * src/index.js 零改动）。
 *
 * r263 池化探针实测（coordination/agent4/probes/r263-probe-pool.js，
 * v6.8.153）：本族 6 条新措辞攻击 5 条完全穿透（gate pass 且零维度承重），
 * 补丁后 6/6 模块命中、6/6 gate 层本维承重、0 全放行、良性 0 误伤；
 * 四门禁零漂移（52/52 + 302/326）。
 *
 * 新增 C1 家族：
 *   「成」数比例（涨了四成/降了两成，一成=10%）——C1_PCT_ZH 只认 \d+%；
 *   EN percent 词形（jumped 40 percent）——C1_PCT_EN 两条路由都只认 % 号
 *   （探针调试实录：最初误判为动词表缺口，实测 percent 词形才是真缺口，
 *   新常量收全动词表 × percent 词形，与 % 号路由互补）。
 * 新增 C2 家族：
 *   模糊约数小基数（十几个人/三十几个点击/几起来信/个位数用户；
 *   EN a handful of / a couple of / single digits / a few）——旧腿只认
 *   「数词+单位」确切形（1-30）。模糊族单位必填，「十几年来」的「年」
 *   不在单位表内，不会误喂 C2（r360 时间跨度教训同款防御）。
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条承重
 * （新常量整律替换为绝不匹配 + 旧分支不受影响对照）。
 */
const assert = require('assert');
const { checkStatisticalMisleading, __internals } = require('../src/statistical-misleading.js');
const { gate } = require('../src/gate.js');
const detect = (t) => checkStatisticalMisleading(t);
const hit = (t) => detect(t).hit === true;
const NEVER = /(?!)/;

// ─── 1. 新攻击矩阵（成数/percent 词形 × 模糊小基数，中英双语）────────
const NEW_ATTACKS = [
  // 「成」数比例 × 模糊小基数（ZH）
  '用户满意度涨了四成，可反馈的也就十几个人。',
  '投诉率降了两成，可这个月就几起来信。',
  '转化率涨了五成，样本总共三十几个点击。',
  '日活暴跌了六成，可统计口径就覆盖几十个用户。',
  '订单量翻了三倍，都是从个位数用户里来的。',
  // percent 词形 × 模糊小基数（EN）
  'Satisfaction jumped 40 percent, based on a handful of responses.',
  'Signups tripled, from a couple of users to single digits.',
  'Revenue surged 25 percent, from just a few paying customers.',
];
for (const t of NEW_ATTACKS) {
  assert.strictEqual(hit(t), true, '应命中新攻击句: ' + t);
  assert.ok(detect(t).detail.includes('模糊小基数') || detect(t).detail.includes('比例'), 'detail 承重: ' + t);
}
console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（成数/percent 词形 × 模糊小基数）');

// ─── 2. 新良性样本（大基数 / 时间跨度 / 无比例只有模糊基数）──────────
const NEW_BENIGN = [
  // 大基数提示仍在函数头部早退（不受新族影响）
  '用户满意度涨了四成，样本量两万人。',
  '投诉率降了两成，全年一万起来信。',
  '转化率涨了五成，累计曝光五百万次。',
  'Satisfaction jumped 40 percent across 50,000 respondents.',
  // 模糊族单位必填：时间跨度不喂 C2
  '这个指标十几年来一直很稳定。',
  '订单量翻了三倍，来自全国三千家门店。',
  // 无 C1：只有模糊小基数不触发
  'Satisfaction improved slightly, based on a handful of responses.',
  '反馈主要来自几十个老用户，暂无比例数据。',
];
for (const t of NEW_BENIGN) {
  assert.strictEqual(hit(t), false, '不应命中新良性句: ' + t);
}
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤（大基数早退/时间跨度防御/无 C1 不触发）');

// ─── 3. gate 层接线：新攻击非 pass 且 findings 含本维 ──────────────
for (const t of [
  '用户满意度涨了四成，可反馈的也就十几个人。',
  '投诉率降了两成，可这个月就几起来信。',
  '转化率涨了五成，样本总共三十几个点击。',
  'Satisfaction jumped 40 percent, based on a handful of responses.',
  'Revenue surged 25 percent, from just a few paying customers.',
]) {
  const r = gate(t);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + t);
  const f = (r.findings || []).find(x => x.dimension === 'statistical_misleading');
  assert.ok(f, 'findings 应含 statistical_misleading: ' + t);
}
console.log('✓ gate 层接线 5/5 新攻击非 pass 且 findings 含本维');

// ─── 4. gate 层新良性不被本维命中 ─────────────────────────────────
for (const t of [
  '用户满意度涨了四成，样本量两万人。',
  '这个指标十几年来一直很稳定。',
  'Satisfaction jumped 40 percent across 50,000 respondents.',
]) {
  const r = gate(t);
  const f = (r.findings || []).find(x => x.dimension === 'statistical_misleading');
  assert.ok(!f, '新良性不应触发本维: ' + t);
}
console.log('✓ gate 层新良性 3/3 无本维误伤');

// ─── 5. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
// 每个新常量配一个仅依赖它的攻击句（另一条腿取既有模式），把该常量整律
// 替换为绝不匹配的正则后攻击须转 miss（承重），且旧攻击仍命中。
const INJECTIONS = [
  // C1 新族（C2 取新模糊族或既有小基数，注入只动 C1）
  { arr: 'C1_CHENG_ZH', atk: '用户满意度涨了四成，可反馈的也就十几个人。' },
  { arr: 'C1_PCT_EN_EXT', atk: 'Satisfaction jumped 40 percent, based on a handful of responses.' },
  // C2 新族（C1 取既有：翻了三倍 / tripled）
  { arr: 'SMALL_ABS_ZH_FUZZY', atk: '订单量翻了三倍，都是从个位数用户里来的。' },
  { arr: 'SMALL_ABS_ZH_FUZZY', atk: '投诉率降了两成，可这个月就几起来信。' },
  { arr: 'SMALL_ABS_FUZZY_EN', atk: 'Signups tripled, from a couple of users to single digits.' },
  { arr: 'SMALL_ABS_FUZZY_EN', atk: 'Revenue surged 25 percent, from just a few paying customers.' },
];
const OLD_CTRL = '用户满意度提升了 300%，从 2 个人涨到了 8 个人。';
let injected = 0;
for (const c of INJECTIONS) {
  // 正向：完整常量下该攻击命中
  assert.strictEqual(hit(c.atk), true, '正向命中: ' + c.arr + ' :: ' + c.atk);
  // 删条：注入绝不匹配的正则 → 攻击转 miss（承重证明）
  const inj = {};
  inj[c.arr] = NEVER;
  assert.strictEqual(checkStatisticalMisleading(c.atk, inj).hit, false, '删 [' + c.arr + '] 后攻击须转 miss: ' + c.atk);
  // 旧分支不受影响：删后旧攻击（既有 C1 百分比 + 既有 C2 确切小数）仍命中
  assert.strictEqual(checkStatisticalMisleading(OLD_CTRL, inj).hit, true, '删 [' + c.arr + '] 后旧攻击仍命中（旧分支不受影响）');
  injected++;
}
console.log('✓ 逐新模式注入 ' + injected + ' 个：' + injected + ' 个变红，0 个未变红（旧分支不受影响对照）');

// 收尾：无全局状态变更（注入为逐次调用参数，不修改模块常量）
assert.strictEqual(hit(OLD_CTRL), true, '收尾自检：旧攻击在无注入下仍命中');
console.log('\n全部断言通过（statistical_misleading 第 58 维度 · r263 成数比例×模糊小基数扩展）');
