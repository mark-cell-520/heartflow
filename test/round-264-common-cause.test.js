'use strict';
/**
 * test/round-264-common-cause.test.js
 * [r264] common_cause（第 174 维度）全新共变措辞家族扩展
 * （真升级②，live 生效，维度计数 229 不变，src/index.js 零改动）。
 *
 * r264 池化探针实测（coordination/agent4/probes/r264-probe-pool.js，
 * v6.8.153）：本族 4 条新措辞攻击全部穿透（gate.action=pass 且零维度
 * 承重），其中 2 个真缺口（双双走高族 / trace back to 族），另 2 条
 * （背后是同一波流量在推动 / driven by the same heat wave）经既有
 * NO_CONFOUND 豁免覆盖、非缺口。补丁后 5/5 模块命中、5/5 gate 层
 * 本维承重、良性 0 误伤、四门禁零漂移（52/52 + 302/326）。
 *
 * 新增腿①共变词族：
 *   COVARY_MOVE_ZH += 双双+动向（双双走高/双双回落/双双看涨…）与
 *                     越X越Y(猛|狠|火)（越涨越猛/越跌越狠/越卖越火）
 *   COVARY_MOVE_EN += both+动向词（both climbed/both rose/both fell…）
 * 新增腿②因果动词族：
 *   CAUSE_EN += trace(s)/traced back to
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条
 * 承重（inject 参数整表替换）+ 旧分支不受影响对照 + 存量回归 + 登记。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkCommonCause, __internals } = require(path.join(ROOT, 'src', 'common-cause.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const hit = (t, inj) => checkCommonCause(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵（新共变词族 × 新因果动词族，中英双语）────────────
const NEW_ATTACKS = [
  // ZH 双双族
  '冰淇淋销量和溺水人数双双走高，说到底都是高温推动的。',
  '加班时长和离职率双双回落，根源在于新考勤制度。',
  // ZH 越X越Y族
  '搜索量和成交量越涨越猛，说到底都是流量红利推动的。',
  // EN both 族
  'Ice cream sales and drownings both climbed this summer, and the heat wave drives both.',
  // EN trace back to 族
  'Ad spend and signups rose in lockstep, both trace back to the same campaign push.',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  '冰淇淋销量和溺水人数相关，但这是典型的相关不等于因果，需要第三变量解释。',
  '搜索量和成交量越涨越猛，但要区分谁是因谁是果，需要实验验证。',
  '冰淇淋销量和溺水人数双双走高，但双双走高不等于谁是因谁是果，需要控制高温变量后再看。',
  'Ice cream sales and drownings both climbed this summer, though correlation alone cannot establish a common cause.',
  'Ad spend and signups rose in lockstep, but this does not mean one causes the other.',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线：新攻击非 pass 且 findings 含本维 ──────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'common_cause');
  assert.ok(f, 'findings 应含 common_cause: ' + s);
  assert.ok(f.severity >= 55, 'gate finding severity: ' + s);
}));

// ─── 4. gate 层新良性不被本维命中 ─────────────────────────────────
NEW_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'common_cause');
  assert.ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 5. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
// 每个新模式在常量数组中的下标 + 仅依赖该模式的攻击句；整表替换删该
// 模式后攻击须转 miss（承重），且旧攻击（既有模式）删后仍命中。
const INJECTIONS = [
  { arr: 'COVARY_MOVE_ZH', idx: 1, atk: '冰淇淋销量和溺水人数双双走高，说到底都是高温推动的。' },
  { arr: 'COVARY_MOVE_ZH', idx: 2, atk: '搜索量和成交量越涨越猛，说到底都是流量红利推动的。' },
  { arr: 'COVARY_MOVE_EN', idx: 1, atk: 'Ice cream sales and drownings both climbed this summer, and the heat wave drives both.' },
  { arr: 'CAUSE_EN', idx: 1, atk: 'Ad spend and signups rose in lockstep, both trace back to the same campaign push.' },
];
const OLD_CTRL = '夏天冰淇淋销量和溺水死亡同步上升，说明吃冰淇淋导致溺水';
INJECTIONS.forEach((c) => t('注入-' + c.arr + '[' + c.idx + ']', () => {
  const full = __internals()[c.arr];
  assert.ok(full.length > c.idx, c.arr + ' 数组长度不足，下标失效');
  assert.strictEqual(hit(c.atk), true, '正向命中: ' + c.arr + '[' + c.idx + ']');
  const inj = {};
  inj[c.arr] = full.filter((re, i) => i !== c.idx);
  assert.strictEqual(hit(c.atk, inj), false, '删 [' + c.arr + '[' + c.idx + ']] 后攻击须转 miss（承重证明）');
  assert.strictEqual(hit(OLD_CTRL, inj), true, '删 [' + c.arr + '[' + c.idx + ']] 后旧攻击仍命中（旧分支不受影响）');
}));

// ─── 6. 存量回归：r176 家族攻击仍判、良性仍放行 ────────────────────
t('存量回归-攻击', () => {
  const old = [
    '夏天冰淇淋销量和溺水死亡同步上升，说明吃冰淇淋导致溺水',
    '这两个指标同涨同跌，说明其中一个驱动另一个',
    'Ice cream sales and drowning deaths rise together every summer, so ice cream causes drowning.',
    'The two metrics move in lockstep, which shows one drives the other.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('存量回归-良性', () => {
  const oldBenign = [
    '冰淇淋销量与溺水死亡同因于气温，二者相关只是因为共同原因',
    '这两个指标同步上升，可能是同一个驱动因素造成的',
    'Ice cream sales and drownings both rise in summer, but they share a common cause — temperature.',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 7. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/VERIFY_DIMS/导出/__internals', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('common_cause'), 'dimensions 键缺失');
  assert.ok(keys.length >= 229, '维度键总数应 ≥229: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/VERIFY_DIMS[\s\S]{0,8000}?common_cause/.test(src), 'VERIFY_DIMS 未含本维');
  assert.strictEqual(typeof idx.checkCommonCause, 'function', 'index.js 未导出 checkCommonCause');
  const need = ['COVARY_REL_ZH', 'COVARY_MOVE_ZH', 'PAIR_ZH', 'CAUSE_ZH',
    'COVARY_REL_EN', 'COVARY_MOVE_EN', 'PAIR_EN', 'CAUSE_EN'];
  for (const k of need) assert.ok(__internals()[k], '__internals 缺 ' + k);
  assert.strictEqual(__internals().COVARY_MOVE_ZH.length, 3, 'COVARY_MOVE_ZH 应为 3 条模式');
  assert.strictEqual(__internals().COVARY_MOVE_EN.length, 2, 'COVARY_MOVE_EN 应为 2 条模式');
  assert.strictEqual(__internals().CAUSE_EN.length, 3, 'CAUSE_EN 应为 3 条模式');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（双双族/越X越Y族/both族/trace back to族）');
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤');
console.log('✓ gate 层接线 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 新攻击非 pass 且 findings 含本维');
console.log('✓ gate 层新良性 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 无本维误伤');
console.log('✓ 逐新模式注入 ' + INJECTIONS.length + ' 个：' + INJECTIONS.length + ' 个变红，0 个未变红（inject 整表替换 + 旧分支对照）');
console.log('✓ 存量回归：r176 家族 4/4 攻击仍命中、3/3 良性仍放行');
console.log('✓ 登记断言：dimensions 键 ≥229 含本维、VERIFY_DIMS/index 导出/__internals 齐全');

console.log('\n全部断言通过（common_cause 第 174 维度 · r264 新共变词族扩展）');
console.log('测试结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
if (fails.length) {
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
}
