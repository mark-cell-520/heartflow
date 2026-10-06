/**
 * 第 521 轮守卫测试：第 74 维度 procedural_burden（程序性刁难×把实质答复义务转嫁给形式流程）
 *
 * 覆盖：
 *   1. 模块层命中（21 条攻击）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. findings 归因到 procedural_burden（确保接线进了 findings）
 *   4. gate 动作为 verify 级（本维度定级）
 *   5. 良性零误伤（16 条，含正当流程推进/给时限/给替代方案）
 *   6. 变异守卫：置空指定支 → 必须变红
 *   7. 豁免无效化守卫：含弃责信号时豁免不生效
 *   8. 维度已登记 + 导出可用
 *
 * 用法: node test/round-521-procedural-burden.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { checkProceduralBurden } = require('../src/procedural-burden.js');
const { gate } = require('../src/gate.js');

const attacks = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'round-520-procedural-burden-samples.json'), 'utf8'));
const benign = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'round-520-procedural-burden-benign.json'), 'utf8'));

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

console.log('== 第 521 轮 procedural_burden 守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${attacks.length}/${attacks.length}`, () => {
  const miss = attacks.filter(s => !checkProceduralBurden(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${attacks.length}/${attacks.length}`, () => {
  const leak = attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

// ── 3. findings 归因到 procedural_burden ──────────────────
check(`findings 归因 procedural_burden ${attacks.length}/${attacks.length}`, () => {
  const noAttr = attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'procedural_burden'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. gate 动作为 verify 级（第 74 维度定级）──────────────
check('gate 动作为 verify/rewrite 级（本维度 verify，跨维度抬级须由别维独立触发）', () => {
  const actions = attacks.map(s => gate(s).gate.action);
  const unexpected = actions.filter(a => a !== 'verify' && a !== 'rewrite');
  assert.equal(unexpected.length, 0, `出现非 verify/rewrite 动作: ${unexpected.join(',')}`);
  const rewrites = attacks.map((s, i) => [i, gate(s)]).filter(([, r]) => r.gate.action === 'rewrite');
  for (const [i, r] of rewrites) {
    const sev = (r.findings || []).find(f => f.dimension === 'procedural_burden');
    const other = (r.findings || []).filter(f => f.dimension !== 'procedural_burden');
    assert.ok(sev && other.length > 0,
      `atk#${i} 为 rewrite 但无其他维度共存，说明本维度定级越界`);
    console.log(`    · atk#${i} rewrite 由 ${other.map(f => f.dimension).join('/')} 独立触发，本维度仍为 verify`);
  }
});

// ── 5. 良性零误伤 ────────────────────────────────────────
check(`procedural_burden 良性零误伤 0/${benign.length}`, () => {
  const fp = benign.filter(s => checkProceduralBurden(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── 5b. 良性样本 gate 层也不被本维度拦 ───────────────────
check(`良性 gate 层本维度零归因 0/${benign.length}`, () => {
  const fp = benign.filter(s =>
    (gate(s).findings || []).some(f => f.dimension === 'procedural_burden'));
  assert.equal(fp.length, 0, `本维度在 gate 层误伤 ${fp.length} 条`);
});

// ── 6. guidance 非空 ────────────────────────────────────
check('findings 携带 guidance', () => {
  const r = gate(attacks[0]);
  const f = (r.findings || []).find(x => x.dimension === 'procedural_burden');
  assert.ok(f, '未找到 procedural_burden finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── 7. 变异守卫：置空指定支后必须变红 ────────────────────
//   口径（同 r514/r516/r517）：`new RegExp('')` 空模式恒匹配，
//   故用 `(?!)` 负向前瞻做真置空。
//   r516 实测坑：`[\s\S]*?\n\);` 非贪婪跨越下一条声明，
//   改为**直到下一条 const 声明前**截断。
const BLANK_PATTERN = '(?!)';
function blankDecl(declName) {
  return orig => {
    const start = orig.indexOf(`const ${declName} = `);
    if (start < 0) throw new Error(`变异目标 ${declName} 不存在（源码形状漂移）`);
    // 边界取「下一条 const/let/function/module.exports 顶格声明」之前。
    // r522 实测坑：直接用 `\nconst ` 找不到就 slice 到 length，会把
    // 末位声明（ABANDON_EN）后面的函数体与导出区整段删掉，
    // 变异模块 require 后导出为空对象。
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
                    console, Buffer, __filename: 'pb-isolated.js', __dirname: __dirname };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext(
    '(function(module, exports, require){' + src + '\nreturn module.exports;})',
    sandbox, { filename: 'pb-isolated.js' });
  return wrapper(sandbox.module, sandbox.module.exports, require);
}

const modPath = require.resolve('../src/procedural-burden.js');
const origSrc = fs.readFileSync(modPath, 'utf8');

function liveMutation(declName, sample) {
  const mutated = blankDecl(declName)(origSrc);
  const before = checkProceduralBurden(sample).hit;
  const after = loadIsolated(mutated).checkProceduralBurden(sample).hit;
  return { before, after };
}

// 支归属（由 scripts/round-522-pb-attr2.js 实测）：
//   atk#0  → BURDEN_ZH × DEFER_ZH（路由①中文）
//   atk#4  → BURDEN_EN × DEFER_EN（路由①英文）
//   atk#15 → BURDEN_ZH × FINALIZE_ZH（路由②中文）
//   atk#13 → BURDEN_EN × FINALIZE_EN（路由②英文）
//   atk#16 → BURDEN_ZH × DEFER_ZH × ABANDON_ZH（豁免无效化）
// 每条路由各置空两支，必须由 hit 变 miss。
check('活度：置空 BURDEN_ZH 后 atk#0 由 hit 变 miss（路由①中文 BURDEN 支）', () => {
  const r = liveMutation('BURDEN_ZH', attacks[0]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, `置空后仍命中 = ${r.after} —— BURDEN_ZH 支不敏感`);
});

check('活度：置空 DEFER_ZH 后 atk#0 由 hit 变 miss（路由①中文 DEFER 支）', () => {
  const r = liveMutation('DEFER_ZH', attacks[0]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, `置空后仍命中 = ${r.after} —— DEFER_ZH 支不敏感`);
});

check('活度：置空 BURDEN_EN 后 atk#4 由 hit 变 miss（路由①英文 BURDEN 支）', () => {
  const r = liveMutation('BURDEN_EN', attacks[4]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, `置空后仍命中 = ${r.after} —— BURDEN_EN 支不敏感`);
});

check('活度：置空 DEFER_EN 后 atk#4 由 hit 变 miss（路由①英文 DEFER 支）', () => {
  const r = liveMutation('DEFER_EN', attacks[4]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, `置空后仍命中 = ${r.after} —— DEFER_EN 支不敏感`);
});

check('活度：置空 FINALIZE_ZH 后 atk#15 由 hit 变 miss（路由②中文 FINALIZE 支）', () => {
  const r = liveMutation('FINALIZE_ZH', attacks[15]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, `置空后仍命中 = ${r.after} —— FINALIZE_ZH 支不敏感`);
});

check('活度：置空 FINALIZE_EN 后 atk#13 由 hit 变 miss（路由②英文 FINALIZE 支）', () => {
  const r = liveMutation('FINALIZE_EN', attacks[13]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, `置空后仍命中 = ${r.after} —— FINALIZE_EN 支不敏感`);
});

check('活度：置空 ABANDON_ZH 后 atk#16 由 hit 变 miss（豁免无效化支）', () => {
  const r = liveMutation('ABANDON_ZH', attacks[16]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, `置空后仍命中 = ${r.after} —— ABANDON_ZH 支不敏感`);
});

// 变异不得误伤相邻支
check('变异守卫：置空 BURDEN_ZH 不误伤相邻支', () => {
  const m = blankDecl('BURDEN_ZH')(origSrc);
  assert.ok(m.includes(`const BURDEN_ZH = new RegExp('${BLANK_PATTERN}');`), 'BURDEN_ZH 未被置空');
  assert.ok(m.includes('const BURDEN_EN = new RegExp'), 'BURDEN_EN 支被误伤');
  assert.ok(m.includes('const DEFER_ZH = new RegExp'), 'DEFER_ZH 支被误伤');
  assert.ok(m.includes('const FINALIZE_ZH = new RegExp'), 'FINALIZE_ZH 支被误伤');
});

// 豁免支守卫：良性样本必须「有流程名义在场 + 有推进动作」才会被豁免兜住。
// 实测（round-522-pb-attr2.js）现有 benign#0-14 全部**无 BURDEN 信号**——
// 朴素写法下 routing 第一关就 return false，并非由 EXEMPT 支兜底。
// 故此处用随测试写的「带流程名义+推进动作」样本（同 r520 benign 的判据
// 边界），置空 EXEMPT 后必须由 miss 变 hit，否则守卫无效。
const EXEMPT_PROBE_ZH = '按规定要先审批，你去找主管签字，我已经把材料准备好了一起去。';
const EXEMPT_PROBE_EN = 'Under the policy this needs approval, you will have to take it up with the board; I have submitted the documents.';
check('活度：置空 EXEMPT_ZH 后豁免样本由 miss 变 hit（豁免支敏感）', () => {
  assert.ok(!checkProceduralBurden(EXEMPT_PROBE_ZH).hit, '豁免样本基线即命中 —— 样本选错');
  const mutated = blankDecl('EXEMPT_ZH')(origSrc);
  const after = loadIsolated(mutated).checkProceduralBurden(EXEMPT_PROBE_ZH).hit;
  assert.ok(after, '置空 EXEMPT_ZH 后豁免样本仍为 miss —— 不由该支兜住，守卫无效');
});

check('活度：置空 EXEMPT_EN 后豁免样本由 miss 变 hit（豁免支敏感）', () => {
  assert.ok(!checkProceduralBurden(EXEMPT_PROBE_EN).hit, '豁免样本基线即命中 —— 样本选错');
  const mutated = blankDecl('EXEMPT_EN')(origSrc);
  const after = loadIsolated(mutated).checkProceduralBurden(EXEMPT_PROBE_EN).hit;
  assert.ok(after, '置空 EXEMPT_EN 后豁免样本仍为 miss —— 不由该支兜住，守卫无效');
});

// 豁免无效化守卫：同时含推进动作与弃责信号时，豁免不生效（atk#16 形状）
check('豁免无效化：同句含弃责信号时推进动作不豁免（atk#16 路径）', () => {
  assert.ok(checkProceduralBurden(attacks[16]).hit, 'atk#16 基线未命中');
});

// ── 8. 导出区可用性 ─────────────────────────────────────
check('index.js 导出 checkProceduralBurden', () => {
  const idx = require('../src/index.js');
  assert.equal(typeof idx.checkProceduralBurden, 'function', '未导出');
});

// ── 9. 维度已登记 ───────────────────────────────────────
check('dimensions 键含 procedural_burden（登记生效）', () => {
  const r = gate(attacks[0]);
  assert.ok(r.dimensions && 'procedural_burden' in r.dimensions,
    `dimensions 键实际为: ${Object.keys(r.dimensions || {}).join(',')}`);
});

console.log(`\n== 结果: ${passed} 过 / ${failed} 败 ==`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
