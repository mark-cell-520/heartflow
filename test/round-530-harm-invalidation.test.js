/**
 * 第 530 轮守卫测试：第 76 维度 harm_invalidation（受害者伤害定性×取消核验前提）
 *
 * 覆盖：
 *   1. 模块层命中（20 条攻击）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. findings 归因到 harm_invalidation（确保接线进了 findings）
 *   4. gate 动作为 verify 级（本维度定级）
 *   5. 良性零误伤（35 条，含取证伤情/医学归因/风险评估等正当表述）
 *   6. 变异守卫：置空指定支 → 必须变红
 *   7. 豁免守卫：置空 EXEMPT 后活度探针必须由 miss 变 hit
 *   8. 维度已登记 + 导出可用
 *
 * [r531] 复测修正：r530 交接报告的「12/12」基于 12 条子集；本测试接手时
 * 用全量 20 条攻击实测，发现 5 条模块层 miss（atk#13/15/16/18/19），
 * 已由 r531 补 6 支正则修复（提交 c08ad0bd）。本文件即为那次的守卫固化。
 *
 * 用法: node test/round-530-harm-invalidation.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { checkHarmInvalidation } = require('../src/harm-invalidation.js');
const { gate } = require('../src/gate.js');

const attacks = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'round-530-harm-invalidation-samples.json'), 'utf8'));
const benign = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'round-530-harm-invalidation-benign.json'), 'utf8'));

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

console.log('== 第 530 轮 harm_invalidation 守卫测试（r531 复测修正版） ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${attacks.length}/${attacks.length}`, () => {
  const miss = attacks.filter(s => !checkHarmInvalidation(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${attacks.length}/${attacks.length}`, () => {
  const leak = attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

// ── 3. findings 归因到 harm_invalidation ──────────────────
check(`findings 归因 harm_invalidation ${attacks.length}/${attacks.length}`, () => {
  const noAttr = attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'harm_invalidation'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. gate 动作为 verify 级（第 76 维度定级）──────────────
check('gate 动作为 verify/rewrite 级（本维度 verify，跨维度抬级须由别维独立触发）', () => {
  const actions = attacks.map(s => gate(s).gate.action);
  const unexpected = actions.filter(a => a !== 'verify' && a !== 'rewrite');
  assert.equal(unexpected.length, 0, `出现非 verify/rewrite 动作: ${unexpected.join(',')}`);
  const rewrites = attacks.map((s, i) => [i, gate(s)]).filter(([, r]) => r.gate.action === 'rewrite');
  for (const [i, r] of rewrites) {
    const sev = (r.findings || []).find(f => f.dimension === 'harm_invalidation');
    const other = (r.findings || []).filter(f => f.dimension !== 'harm_invalidation');
    assert.ok(sev && other.length > 0,
      `atk#${i} 为 rewrite 但无其他维度共存，说明本维度定级越界`);
  }
});

// ── 5. 良性零误伤 ────────────────────────────────────────
check(`harm_invalidation 良性零误伤 0/${benign.length}`, () => {
  const fp = benign.filter(s => checkHarmInvalidation(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── 5b. 良性样本 gate 层也不被本维度拦 ───────────────────
check(`良性 gate 层本维度零归因 0/${benign.length}`, () => {
  const fp = benign.filter(s =>
    (gate(s).findings || []).some(f => f.dimension === 'harm_invalidation'));
  assert.equal(fp.length, 0, `本维度在 gate 层误伤 ${fp.length} 条`);
});

// ── 6. guidance 非空 ────────────────────────────────────
check('findings 携带 guidance', () => {
  const r = gate(attacks[0]);
  const f = (r.findings || []).find(x => x.dimension === 'harm_invalidation');
  assert.ok(f, '未找到 harm_invalidation finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── 7. 变异守卫：置空指定支后必须变红 ────────────────────
//   口径（同 r524/r531 实测）：`new RegExp('')` 空模式恒匹配，
//   故用 `(?!)` 负向前瞻做真置空。边界取「下一条 const/let/var/function/
//   module.exports 顶格声明」之前——r531 一度误用 `].join` 之前做边界，
//   导致数组收尾滞留原地成语法错误，修正记录见 scripts/round-531-mutation-liveness.js
const BLANK_PATTERN = '(?!)';
function blankDecl(declName) {
  return orig => {
    const start = orig.indexOf(`const ${declName} = new RegExp([`);
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
                    console, Buffer, __filename: 'himv-isolated.js', __dirname: __dirname };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext(
    '(function(module, exports, require){' + src + '\nreturn module.exports;})',
    sandbox, { filename: 'himv-isolated.js' });
  return wrapper(sandbox.module, sandbox.module.exports, require);
}

const modPath = require.resolve('../src/harm-invalidation.js');
const origSrc = fs.readFileSync(modPath, 'utf8');

function liveMutation(declName, sample) {
  const mutated = blankDecl(declName)(origSrc);
  const before = checkHarmInvalidation(sample).hit;
  const after = loadIsolated(mutated).checkHarmInvalidation(sample).hit;
  return { before, after };
}

// 支归属（r531 scripts/round-531-two-sided-diag.js + mutation-liveness.js 实测）：
//   atk#17 → HARM_DENY_ZH（范围全否形：没受到任何影响，r531 补支）
//   atk#6  → MINIMIZE_ZH（让步宾语形：只是不适应新流程，r531 补支）
//   atk#18 → HARM_DENY_EN（there was no real damage，r531 补 no 形）
//   atk#19 → MINIMIZE_EN（just being oversensitive，r531 补 just 介入形）
// 每支各置空，必须由 hit 变 miss。
check('活度：置空 HARM_DENY_ZH 后 atk#17 由 hit 变 miss（伤害否认支·中文）', () => {
  const r = liveMutation('HARM_DENY_ZH', attacks[17]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— HARM_DENY_ZH 支不敏感');
});

check('活度：置空 MINIMIZE_ZH 后 atk#6 由 hit 变 miss（抵消修饰支·中文）', () => {
  const r = liveMutation('MINIMIZE_ZH', attacks[6]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— MINIMIZE_ZH 支不敏感');
});

check('活度：置空 HARM_DENY_EN 后 atk#18 由 hit 变 miss（伤害否认支·英文）', () => {
  const r = liveMutation('HARM_DENY_EN', attacks[18]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— HARM_DENY_EN 支不敏感');
});

check('活度：置空 MINIMIZE_EN 后 atk#19 由 hit 变 miss（抵消修饰支·英文）', () => {
  const r = liveMutation('MINIMIZE_EN', attacks[19]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— MINIMIZE_EN 支不敏感');
});

// 变异不得误伤相邻支
check('变异守卫：置空 HARM_DENY_ZH 不误伤相邻支', () => {
  const m = blankDecl('HARM_DENY_ZH')(origSrc);
  assert.ok(m.includes(`const HARM_DENY_ZH = new RegExp('${BLANK_PATTERN}');`), 'HARM_DENY_ZH 未被置空');
  assert.ok(m.includes('const HARM_DENY_EN = new RegExp'), 'HARM_DENY_EN 支被误伤');
  assert.ok(m.includes('const MINIMIZE_ZH = new RegExp'), 'MINIMIZE_ZH 支被误伤');
  assert.ok(m.includes('const MINIMIZE_EN = new RegExp'), 'MINIMIZE_EN 支被误伤');
  assert.ok(m.includes('const EXEMPT_ZH = new RegExp'), 'EXEMPT_ZH 支被误伤');
});

// ── 8. 豁免守卫：置空 EXEMPT 后活度探针必须由 miss 变 hit ──
//  语义：探针必须同时含「豁免特征」与「攻击侧特征」——EXEMPT 在场时
//  被兜住（miss），置空后攻击侧独立成立（hit）。
//  r531 实测：r530 落盘的 35 条良性样本中**没有**一条满足该语义
//  （它们是纯核算/纯自担表述，攻击侧无一命中），故自建探针，
//  候选由 scripts/round-531-exempt-probe-search.js 从 18 个组合中筛出，
//  再用 scripts/round-531-exempt-probe-search2.js 以真实攻击样本作种子
//  从 120 个组合（ZH 90 / EN 30）中确认。
const EXEMPT_PROBE_ZH = '受损名单已经核实，她根本没受伤，就是自己吓自己';
const EXEMPT_PROBE_EN =
  'According to the report, certified as a minor injury, and It was not a real injury, she was imagining the whole thing.';
check('活度：置空 EXEMPT_ZH 后豁免样本由 miss 变 hit（豁免支敏感·中文）', () => {
  assert.ok(!checkHarmInvalidation(EXEMPT_PROBE_ZH).hit, '豁免样本基线即命中 —— 样本选错');
  const mutated = blankDecl('EXEMPT_ZH')(origSrc);
  const after = loadIsolated(mutated).checkHarmInvalidation(EXEMPT_PROBE_ZH).hit;
  assert.ok(after, '置空 EXEMPT_ZH 后豁免样本仍为 miss —— 不由该支兜住，守卫无效');
});

check('活度：置空 EXEMPT_EN 后豁免样本由 miss 变 hit（豁免支敏感·英文）', () => {
  assert.ok(!checkHarmInvalidation(EXEMPT_PROBE_EN).hit, '豁免样本基线即命中 —— 样本选错');
  const mutated = blankDecl('EXEMPT_EN')(origSrc);
  const after = loadIsolated(mutated).checkHarmInvalidation(EXEMPT_PROBE_EN).hit;
  assert.ok(after, '置空 EXEMPT_EN 后豁免样本仍为 miss —— 不由该支兜住，守卫无效');
});

// ── 9. 导出区可用性 ─────────────────────────────────────
check('index.js 导出 checkHarmInvalidation', () => {
  const idx = require('../src/index.js');
  assert.equal(typeof idx.checkHarmInvalidation, 'function', '未导出');
});

// ── 10. 维度已登记 ──────────────────────────────────────
check('dimensions 键含 harm_invalidation（登记生效）', () => {
  const r = gate(attacks[0]);
  assert.ok(r.dimensions && 'harm_invalidation' in r.dimensions,
    `dimensions 键实际为: ${Object.keys(r.dimensions || {}).join(',')}`);
});

// ── 11. r531 补支的六处接线点齐备 ───────────────────────
// r531 修正的 6 支正则是本轮唯一证据：其中任一被回退，atk#6/17/18/19
// 立刻回归 miss。这里用「支源码子串在场」做结构断言（比行为断言更早
// 发现正则被人改写成等价格式但掉了锚点的情况）。
// 用子串而非正则：r531 首版用正则写锚点，`\(?:` 被解析成「可选 (」，
// 导致全部误报缺失；子串比较没有转义歧义。
check('r531 六支锚点在源码中齐备（防回退）', () => {
  const anchors = [
    '(?:没|未)(?:有)?\\s*受\\s*(?:到|及|遭)',          // 范围全否形
    '(?:只\\s*是|不\\s*过|仅\\s*仅|纯\\s*粹|就\\s*是)\\s*(?:对|对\\s*于)?', // 让步宾语形
    '(?:大\\s*家|他\\s*们|你\\s*们|自\\s*己)\\s*(?:其\\s*实',              // 转述不适应形
    '(?:谁|大\\s*家|人\\s*家|任\\s*何\\s*人|当\\s*事\\s*人)\\s*(?:也|都)',  // 量级少毫毛形
    '\\\\b(?:there\\\\s+(?:was|were|is)|it\\\\s+(?:was\\\\s+)?(?:caused|did))\\\\s*(?:no|not\\\\s+a|not\\\\s+any)\\\\s*', // EN no 形
    '\\\\b(?:they|she|he)\\\\s+(?:are|is)\\\\s+(?:(?:just|merely|only)\\\\s+)?(?:being\\\\s+)?', // EN just 介入形
  ];
  for (const [i, a] of anchors.entries()) {
    assert.ok(origSrc.includes(a), `r531 补支 #${i} 锚点缺失 —— 疑似被回退`);
  }
});

console.log(`\n== 结果: ${passed} 过 / ${failed} 败 ==`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
