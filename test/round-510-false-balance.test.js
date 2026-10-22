/**
 * 第 510 轮守卫测试：第 71 维度 false_balance（虚假平衡×等权并置未证实指控与已证事实）
 *
 * 覆盖：
 *   1. 模块层命中（16 条攻击）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. findings 归因到 false_balance（确保接线进了 findings，不是别的维度兜底）
 *   4. gate 动作 = verify
 *   5. 良性零误伤（12 条，含证据状态明示/科学争议/已排除结论/评析豁免）
 *   6. 变异守卫：注入攻击判据（删掉一支正则）→ 必须变红
 *   7. 维度已登记 + 导出可用
 *
 * 用法: node test/round-510-false-balance.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { checkFalseBalance } = require('../src/false-balance.js');
const { gate } = require('../src/gate.js');

const samples = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'round-510-false-balance-samples.json'), 'utf8'));

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

console.log('== 第 510 轮 false_balance 守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${samples.attacks.length}/${samples.attacks.length}`, () => {
  const miss = samples.attacks.filter(s => !checkFalseBalance(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${samples.attacks.length}/${samples.attacks.length}`, () => {
  const leak = samples.attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

// ── 3. findings 归因到 false_balance（接线有效性断言）────
check(`findings 归因 false_balance ${samples.attacks.length}/${samples.attacks.length}`, () => {
  const noAttr = samples.attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'false_balance'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. gate 动作 = verify ─────────────────────────────────
check('gate 动作为 verify 级（第 71 维度定级）', () => {
  const actions = new Set(samples.attacks.map(s => gate(s).gate.action));
  assert.deepEqual([...actions], ['verify'], `实际动作集合: ${[...actions].join(',')}`);
});

// ── 5. 良性零误伤（false_balance 维度口径）────────────────
//   口径（同 r507/r508）：只断言本维度不误伤。整句 gate 非 pass 若来自
//   其他维度不归本维度负责——那是既有维度的独立行为。
check(`false_balance 良性零误伤 0/${samples.benign.length}`, () => {
  const fp = samples.benign.filter(s => checkFalseBalance(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── 6. guidance 非空（findings 可指导修复）─────────────────
check('findings 携带 guidance', () => {
  const r = gate(samples.attacks[0]);
  const f = (r.findings || []).find(x => x.dimension === 'false_balance');
  assert.ok(f, '未找到 false_balance finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── 7. 变异守卫：删掉判据支后必须变红 ─────────────────────
//   做法：对模块源码里的关键正则支做字符级破坏，重新 require，断言命中下降。
//   口径（同 r508）：before/after 均按**该支覆盖的子集样本**比对，
//   不用全量样本读数——否则单支破坏后全量命中仍可能 ≥ 旧值，误判死码。
function mutatedHits(brokenSrc) {
  const tmp = path.join(__dirname, `.tmp-mutant-r510-${process.pid}-${mutantSeq++}.js`);
  fs.writeFileSync(tmp, brokenSrc);
  try {
    delete require.cache[require.resolve(tmp)];
    const { checkFalseBalance: mutated } = require(tmp);
    return mutated;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}
let mutantSeq = 0;

check('变异守卫：破坏 EQUAL_WEIGHT_ZH「都有道理」支后该支独占样本必须下降', () => {
  const modPath = require.resolve('../src/false-balance.js');
  const orig = fs.readFileSync(modPath, 'utf8');
  // r516 修正：原用 atk#0「双方各执一词……都有道理」，但该样本被首支
  // （都|全|各自|两边|双方 … 有道理）与第二支（各执一词族）**双支撑**，
  // 置空首支后第二支仍命中 → 守卫假失败。改用仅由首支独占的样本
  // （r516 新增 atk#16，已通过 samples.json 的 benign 0/12 误伤回归）。
  const idx = samples.attacks.length - 1;
  const before = checkFalseBalance(samples.attacks[idx]).hit;
  const broken = orig.replace(
    "'(?:都|全|各自|两边|双方)(?:有|很|挺|蛮)?(?:道理|理|对)?(?:都有|都有理|有道理|有各自的道理)'",
    "'(?:ZZ|ZZ)(?:ZZ)(?:ZZ)(?:ZZ|ZZ|ZZ|ZZ)'");
  assert.notEqual(broken, orig, '变异未生效（替换目标不存在）');
  const mutated = mutatedHits(broken);
  const after = mutated(samples.attacks[idx]).hit;
  assert.ok(before && !after,
    `变异后命中 ${after} 未变为 false —— 守卫不敏感，该支可能是死码`);
});

check('变异守卫：破坏 EQUAL_WEIGHT_EN「two sides here」支后该支独占样本必须下降', () => {
  const modPath = require.resolve('../src/false-balance.js');
  const orig = fs.readFileSync(modPath, 'utf8');
  // atk#2 "There are two sides here" 由 r510 补支独占
  const before = checkFalseBalance(samples.attacks[1]).hit;
  const broken = orig.replace(
    "'(?:sides?|versions?|accounts?|stories|perspectives?|narratives?)\\\\s+' +\n  '(?:to|in|here|at\\\\s+play|involved)\\\\b'",
    "'(?:ZZ|ZZ)\\\\s+' +\n  '(?:ZZ|ZZ)\\\\b'");
  assert.notEqual(broken, orig, '变异未生效（替换目标不存在）');
  const mutated = mutatedHits(broken);
  const after = mutated(samples.attacks[1]).hit;
  assert.ok(before && !after,
    `变异后命中 ${after} 未变为 false —— 守卫不敏感，该支可能是死码`);
});

check('变异守卫：破坏 CONTESTED_ZH「没有定论」支后该支独占样本必须下降', () => {
  const modPath = require.resolve('../src/false-balance.js');
  const orig = fs.readFileSync(modPath, 'utf8');
  // atk#12「直到今天，这起事件的是非曲直仍然没有定论」由 CONTESTED_ZH r510 补支独占
  const before = checkFalseBalance(samples.attacks[11]).hit;
  // r516 修正：原目标串漏了前导 `'|`（消灭失效支的「或」连接前缀），
  // 导致 orig.replace 找不到目标、变异从未生效（assert.notEqual 假绿）。
  // 另 r516 实测：atk#11 只由本补支独占（EQUAL_WEIGHT_ZH 各支全不支撑），
  // 置空后必须转为 miss —— 这才是真活度守卫。
  const broken = orig.replace(
    "'|(?:直到|直至|时至|到了)(?:今天|如今|现在|目前为止|目前为止)?，?(?:这|该|此)(?:起|件|次|场)?' +\n  '(?:事件|事故|争议|风波|纠纷|案子|问题)(?:的是非曲直|真相|责任|是非|曲直)?(?:仍然|依然|还是|仍|至今)?' +\n  '(?:没有|尚无|未形成)(?:定论|结论|共识)'",
    "'|(?:ZZ|ZZ)' +\n  '(?:ZZ|ZZ)' +\n  '(?:ZZ)(?:ZZ)'");
  assert.notEqual(broken, orig, '变异未生效（替换目标不存在）');
  const mutated = mutatedHits(broken);
  const after = mutated(samples.attacks[11]).hit;
  assert.ok(before && !after,
    `变异后命中 ${after} 未变为 false —— 守卫不敏感，该支可能是死码`);
});

// ── 8. 导出区可用性（接线完整性断言依赖）─────────────────
check('index.js 导出 checkFalseBalance', () => {
  const idx = require('../src/index.js');
  assert.equal(typeof idx.checkFalseBalance, 'function', '未导出');
});

// ── 9. 维度已登记（dimensions 键含 false_balance）───────
check('dimensions 键含 false_balance（登记生效）', () => {
  // gate() 的返回体里才带 dimensions 键（index.js 只导出各维度函数）
  const r = gate(samples.attacks[0]);
  assert.ok(r.dimensions && 'false_balance' in r.dimensions,
    `dimensions 键实际为: ${Object.keys(r.dimensions || {}).join(',')}`);
});

console.log(`\n== 结果: ${passed} 过 / ${failed} 败 ==`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
