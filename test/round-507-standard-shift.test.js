/**
 * 第 507 轮守卫测试：第 70 维度 standard_shift（事后加码×移动验收标准）
 *
 * 覆盖：
 *   1. 模块层命中（17 条攻击）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. findings 归因到 standard_shift（确保接线进了 findings，不是别的维度兜底）
 *   4. gate 动作 = verify
 *   5. 良性零误伤（18 条，含正式变更流程/未达标正当驳回/分级晋升/评析豁免）
 *   6. 变异守卫：注入攻击判据（删掉一支正则）→ 必须变红
 *
 * 用法: node test/round-507-standard-shift.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { checkStandardShift } = require('../src/self-imposed-standard-shift.js');
const { gate } = require('../src/gate.js');

const samples = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'round-507-standard-shift-samples.json'), 'utf8'));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  ❌ ${name} — ${e.message}`);
  }
}

console.log('== 第 507 轮 standard_shift 守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${samples.attacks.length}/${samples.attacks.length}`, () => {
  const miss = samples.attacks.filter(s => !checkStandardShift(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${samples.attacks.length}/${samples.attacks.length}`, () => {
  const leak = samples.attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

// ── 3. findings 归因到 standard_shift（接线有效性断言）────
check(`findings 归因 standard_shift ${samples.attacks.length}/${samples.attacks.length}`, () => {
  const noAttr = samples.attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'standard_shift'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. gate 动作 = verify ─────────────────────────────────
check('gate 动作为 verify 级（第 70 维度定级）', () => {
  const actions = new Set(samples.attacks.map(s => gate(s).gate.action));
  assert.deepEqual([...actions], ['verify'], `实际动作集合: ${[...actions].join(',')}`);
});

// ── 5. 良性零误伤（standard_shift 维度口径）────────────────
//   口径（r508 修正）：只断言本维度不误伤。整句 gate 非 pass 若来自
//   其他维度（如 presupposition）不归本维度负责——这是既有维度的独立行为。
check(`standard_shift 良性零误伤 0/${samples.benign.length}`, () => {
  const fp = samples.benign.filter(s => checkStandardShift(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── 6. guidance 非空（findings 可指导修复）─────────────────
check('findings 携带 guidance', () => {
  const r = gate(samples.attacks[0]);
  const f = (r.findings || []).find(x => x.dimension === 'standard_shift');
  assert.ok(f, '未找到 standard_shift finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── 7. 变异守卫：删掉判据支后必须变红 ─────────────────────
//   做法：对模块源码里的关键正则支做字符级破坏，重新 require，断言命中下降。
//   口径修正（r508）：before/after 均按**该支覆盖的子集样本**比对，
//   不用全量样本读数——否则单支破坏后全量命中仍可能 ≥ 旧值，误判死码。
function mutatedHits(brokenSrc) {
  const tmp = path.join(__dirname, `.tmp-mutant-r507-${process.pid}-${mutantSeq++}.js`);
  fs.writeFileSync(tmp, brokenSrc);
  try {
    delete require.cache[require.resolve(tmp)];
    const { checkStandardShift: mutated } = require(tmp);
    return mutated;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}
let mutantSeq = 0;

check('变异守卫：破坏 SHIFT_ZH 换算法支后该支独占样本必须下降', () => {
  const modPath = require.resolve('../src/self-imposed-standard-shift.js');
  const orig = fs.readFileSync(modPath, 'utf8');
  const before = checkStandardShift(samples.attacks[15]).hit; // atk#16 换算法支独占
  const broken = orig.replace(
    "'|(?:用|按|改按)(?:新|另一套|另外一套|不同)(?:的)?(?:一套|套)' +\n'(?:标准|口径|算法|规则|指标)?(?:来)?(?:算|计算|衡量|考核|评估)'",
    "'|(?:用|按|改按)(?:新|另一套|另外一套|不同)(?:的)?(?:一套|套)' +\n'(?:标准|口径|算法|规则|指标)?(?:来)?(?:ZZ|ZZ)'");
  assert.notEqual(broken, orig, '变异未生效（替换目标不存在）');
  const mutated = mutatedHits(broken);
  const after = mutated(samples.attacks[15]).hit;
  // [v6.8.22 r598] 口径修正：atk#11「你满足合同的要求了，但用新的一套算」的
  // 达成侧还有「满足合同的要求」与「完成/做完」等多支兜底，单破 SHIFT 侧
  // 换算法支不会让该样本翻转。改用**换算法支独占样本**（atk#16「但用新的
  // 一套算，这不算完成」）作变异靶，before/after 均按该样本读数。
  assert.ok(before && !after,
    `变异后命中 ${after} 未变为 false —— 守卫不敏感，该支可能是死码`);
});

// ── 8. 变异守卫：破坏 ACHIEVED_ZH 后命中必须下降 ──────────
check('变异守卫：破坏 ACHIEVED_ZH 数量词前置支后该支独占样本必须下降', () => {
  const modPath = require.resolve('../src/self-imposed-standard-shift.js');
  const orig = fs.readFileSync(modPath, 'utf8');
  const before = checkStandardShift(samples.attacks[10]).hit; // atk#11 数量词前置支独占
  const broken = orig.replace(
    "'|(?:你|你们)?(?:都|全)?(?:这|那|三|两|几|多|\\\\\\\\d+)?(?:轮|次|遍|回|趟)(?:都|已经)?' +\n  '(?:改|修|做|写|讲|说)(?:完|好)(?:了)?'",
    "'|(?:你|你们)?(?:都|全)?(?:这|那|三|两|几|多|\\\\\\\\d+)?(?:轮|次|遍|回|趟)(?:都|已经)?' +\n  '(?:ZZ|ZZ)(?:ZZ)(?:了)?'");
  assert.notEqual(broken, orig, '变异未生效（替换目标不存在）');
  const mutated = mutatedHits(broken);
  const after = mutated(samples.attacks[10]).hit;
  // [v6.8.22 r598] atk#16（索引 15）的达成侧已被 r598 补的「满足…要求」
  // 与「已经交了」多支兜底，单破数量词前置支不翻转；改按**该支独占样本**
  // atk#11（索引 10，「你这三轮改完了」）读数。
  assert.ok(before && !after,
    `变异后命中 ${after} 未变为 false — — 守卫不敏感，该支可能是死码`);
});

// ── 9. 导出区可用性（接线完整性断言依赖）─────────────────
check('index.js 导出 checkStandardShift', () => {
  const idx = require('../src/index.js');
  assert.equal(typeof idx.checkStandardShift, 'function', '未导出');
});

// ── 10. 维度已登记（dimensions 键含 standard_shift）───────
check('dimensions 键含 standard_shift（登记生效）', () => {
  // gate() 的返回体里才带 dimensions 键（index.js 只导出各维度函数）
  const r = gate(samples.attacks[0]);
  assert.ok(r.dimensions && 'standard_shift' in r.dimensions,
    `dimensions 键实际为: ${Object.keys(r.dimensions || {}).join(',')}`);
});
console.log(`\n== 结果: ${passed} 过 / ${failed} 败 ==`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
