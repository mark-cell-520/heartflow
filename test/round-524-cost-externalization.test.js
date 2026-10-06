/**
 * 第 524 轮守卫测试：第 75 维度 cost_externalization（代价转移×取消表态资格）
 *
 * 覆盖：
 *   1. 模块层命中（18 条攻击）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. findings 归因到 cost_externalization（确保接线进了 findings）
 *   4. gate 动作为 verify 级（本维度定级）
 *   5. 良性零误伤（20 条，含正当成本核算/风险共担/知情同意/独立签字）
 *   6. 变异守卫：置空指定支 → 必须变红
 *   7. 豁免守卫：置空 EXEMPT 后良性样本必须由 miss 变 hit
 *   8. 维度已登记 + 导出可用
 *
 * 用法: node test/round-524-cost-externalization.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { checkCostExternalization } = require('../src/cost-externalization.js');
const { gate } = require('../src/gate.js');

const attacks = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'round-524-cost-externalization-samples.json'), 'utf8'));
const benign = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'round-524-cost-externalization-benign.json'), 'utf8'));

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

console.log('== 第 524 轮 cost_externalization 守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${attacks.length}/${attacks.length}`, () => {
  const miss = attacks.filter(s => !checkCostExternalization(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${attacks.length}/${attacks.length}`, () => {
  const leak = attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

// ── 3. findings 归因到 cost_externalization ──────────────────
check(`findings 归因 cost_externalization ${attacks.length}/${attacks.length}`, () => {
  const noAttr = attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'cost_externalization'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. gate 动作为 verify 级（第 75 维度定级）──────────────
check('gate 动作为 verify/rewrite 级（本维度 verify，跨维度抬级须由别维独立触发）', () => {
  const actions = attacks.map(s => gate(s).gate.action);
  const unexpected = actions.filter(a => a !== 'verify' && a !== 'rewrite');
  assert.equal(unexpected.length, 0, `出现非 verify/rewrite 动作: ${unexpected.join(',')}`);
  const rewrites = attacks.map((s, i) => [i, gate(s)]).filter(([, r]) => r.gate.action === 'rewrite');
  for (const [i, r] of rewrites) {
    const sev = (r.findings || []).find(f => f.dimension === 'cost_externalization');
    const other = (r.findings || []).filter(f => f.dimension !== 'cost_externalization');
    assert.ok(sev && other.length > 0,
      `atk#${i} 为 rewrite 但无其他维度共存，说明本维度定级越界`);
  }
});

// ── 5. 良性零误伤 ────────────────────────────────────────
check(`cost_externalization 良性零误伤 0/${benign.length}`, () => {
  const fp = benign.filter(s => checkCostExternalization(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── 5b. 良性样本 gate 层也不被本维度拦 ───────────────────
check(`良性 gate 层本维度零归因 0/${benign.length}`, () => {
  const fp = benign.filter(s =>
    (gate(s).findings || []).some(f => f.dimension === 'cost_externalization'));
  assert.equal(fp.length, 0, `本维度在 gate 层误伤 ${fp.length} 条`);
});

// ── 6. guidance 非空 ────────────────────────────────────
check('findings 携带 guidance', () => {
  const r = gate(attacks[0]);
  const f = (r.findings || []).find(x => x.dimension === 'cost_externalization');
  assert.ok(f, '未找到 cost_externalization finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── 7. 变异守卫：置空指定支后必须变红 ────────────────────
//   口径（同 r514/r516/r517/r521）：`new RegExp('')` 空模式恒匹配，
//   故用 `(?!)` 负向前瞻做真置空。
//   边界取「下一条 const/let/var/function/module.exports 顶格声明」之前，
//   避免把末位声明后的函数体与导出区整段删掉。
const BLANK_PATTERN = '(?!)';
function blankDecl(declName) {
  return orig => {
    const start = orig.indexOf(`const ${declName} = `);
    if (start < 0) throw new Error(`变异目标 ${declName} 不存在（源码形状漂移）`);
    const m = orig.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
    const after = m ? start + 1 + m.index : orig.length;
    const seg = orig.slice(start, after);
    if (!/new RegExp\(/.test(seg)) throw new Error(`${declName} 声明形状异常`);
    return orig.slice(0, start) +
      `const ${declName} = new RegExp('${BLANK_PATTERN}');` + orig.slice(after);
  };
}

// 在同一进程内新建模块上下文，确保变异即刻生效（require 缓存不可靠）
function loadIsolated(src) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process,
                    console, Buffer, __filename: 'cext-isolated.js', __dirname: __dirname };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext(
    '(function(module, exports, require){' + src + '\nreturn module.exports;})',
    sandbox, { filename: 'cext-isolated.js' });
  return wrapper(sandbox.module, sandbox.module.exports, require);
}

const modPath = require.resolve('../src/cost-externalization.js');
const origSrc = fs.readFileSync(modPath, 'utf8');

function liveMutation(declName, sample) {
  const mutated = blankDecl(declName)(origSrc);
  const before = checkCostExternalization(sample).hit;
  const after = loadIsolated(mutated).checkCostExternalization(sample).hit;
  return { before, after };
}

// 支归属（本轮 scripts/round-524-branch-attr.js 实测）：
//   atk#0  → DISTANCE_ZH × DISMISS_ZH（路由①中文）
//   atk#1  → DISTANCE_ZH × DISMISS_ZH（资格消解形）
//   atk#9  → DISTANCE_EN × DISMISS_EN（路由①英文）
//   atk#10 → DISTANCE_EN × LIGHT_EN（路由②英文）
//   atk#3  → DISTANCE_ZH × LIGHT_ZH（路由②中文）
//   atk#14 → DISTANCE_EN × DISMISS_EN（costs-you-nothing 分号形）
// 每支各置空，必须由 hit 变 miss。
check('活度：置空 DISTANCE_ZH 后 atk#0 由 hit 变 miss（疏离支·中文）', () => {
  const r = liveMutation('DISTANCE_ZH', attacks[0]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— DISTANCE_ZH 支不敏感');
});

check('活度：置空 DISMISS_ZH 后 atk#0 由 hit 变 miss（资格消解支·中文）', () => {
  const r = liveMutation('DISMISS_ZH', attacks[0]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— DISMISS_ZH 支不敏感');
});

check('活度：置空 DISTANCE_EN 后 atk#9 由 hit 变 miss（疏离支·英文）', () => {
  const r = liveMutation('DISTANCE_EN', attacks[9]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— DISTANCE_EN 支不敏感');
});

check('活度：置空 DISMISS_EN 后 atk#9 由 hit 变 miss（资格消解支·英文）', () => {
  const r = liveMutation('DISMISS_EN', attacks[9]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— DISMISS_EN 支不敏感');
});

check('活度：置空 LIGHT_EN 后 atk#10 由 hit 变 miss（轻量动作支·英文）', () => {
  const r = liveMutation('LIGHT_EN', attacks[10]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— LIGHT_EN 支不敏感');
});

check('活度：置空 LIGHT_ZH 后 atk#3 由 hit 变 miss（轻量动作支·中文）', () => {
  const r = liveMutation('LIGHT_ZH', attacks[3]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— LIGHT_ZH 支不敏感');
});

check('活度：置空 DISMISS_EN 后 atk#14 由 hit 变 miss（costs-you-nothing 分号形）', () => {
  const r = liveMutation('DISMISS_EN', attacks[14]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— DISMISS_EN 支不敏感');
});

// 变异不得误伤相邻支
check('变异守卫：置空 DISTANCE_ZH 不误伤相邻支', () => {
  const m = blankDecl('DISTANCE_ZH')(origSrc);
  assert.ok(m.includes(`const DISTANCE_ZH = new RegExp('${BLANK_PATTERN}');`), 'DISTANCE_ZH 未被置空');
  assert.ok(m.includes('const DISTANCE_EN = new RegExp'), 'DISTANCE_EN 支被误伤');
  assert.ok(m.includes('const DISMISS_ZH = new RegExp'), 'DISMISS_ZH 支被误伤');
  assert.ok(m.includes('const LIGHT_ZH = new RegExp'), 'LIGHT_ZH 支被误伤');
});

// ── 8. 豁免守卫：置空 EXEMPT 后样本必须由 miss 变 hit ──
//  语义：探针必须同时含「豁免特征」与「攻击侧特征」——EXEMPT 在场时
//  被兜住（miss），置空后攻击侧独立成立（hit）。r525 用 benign[0]/[7]
//  当探针失败，因为那两条是纯核算/纯自担表述，疏离/消解/轻量侧
//  无一命中，置空 EXEMPT 也不会 hit（样本选错，不是引擎支失效）。
//  下面两条内联探针按该语义构造（ZH：核算×自担 + 疏离×资格消解；
//  EN：自担 + 疏离×轻签）。
const EXEMPT_PROBE_ZH =
  '我们先核算每个人的分摊金额，风险由我们承担；你无需承担后果，这事不用你点头。';
const EXEMPT_PROBE_EN =
  'I will bear the cost of the recall, so you do not have to carry the cost yourself, and you can just sign here.';
check('活度：置空 EXEMPT_ZH 后豁免样本由 miss 变 hit（豁免支敏感·中文）', () => {
  assert.ok(!checkCostExternalization(EXEMPT_PROBE_ZH).hit, '豁免样本基线即命中 —— 样本选错');
  const mutated = blankDecl('EXEMPT_ZH')(origSrc);
  const after = loadIsolated(mutated).checkCostExternalization(EXEMPT_PROBE_ZH).hit;
  assert.ok(after, '置空 EXEMPT_ZH 后豁免样本仍为 miss —— 不由该支兜住，守卫无效');
});

check('活度：置空 EXEMPT_EN 后豁免样本由 miss 变 hit（豁免支敏感·英文）', () => {
  assert.ok(!checkCostExternalization(EXEMPT_PROBE_EN).hit, '豁免样本基线即命中 —— 样本选错');
  const mutated = blankDecl('EXEMPT_EN')(origSrc);
  const after = loadIsolated(mutated).checkCostExternalization(EXEMPT_PROBE_EN).hit;
  assert.ok(after, '置空 EXEMPT_EN 后豁免样本仍为 miss —— 不由该支兜住，守卫无效');
});

// ── 9. 导出区可用性 ─────────────────────────────────────
check('index.js 导出 checkCostExternalization', () => {
  const idx = require('../src/index.js');
  assert.equal(typeof idx.checkCostExternalization, 'function', '未导出');
});

// ── 10. 维度已登记 ──────────────────────────────────────
check('dimensions 键含 cost_externalization（登记生效）', () => {
  const r = gate(attacks[0]);
  assert.ok(r.dimensions && 'cost_externalization' in r.dimensions,
    `dimensions 键实际为: ${Object.keys(r.dimensions || {}).join(',')}`);
});

console.log(`\n== 结果: ${passed} 过 / ${failed} 败 ==`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
