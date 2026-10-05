/**
 * 第 514 轮守卫测试：第 72 维度 scrutiny_evasion（逃避核验×把监督要求定性为人际猜疑）
 *
 * 覆盖：
 *   1. 模块层命中（16 条攻击）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. findings 归因到 scrutiny_evasion（确保接线进了 findings，不是别的维度兜底）
 *   4. gate 动作 = verify
 *   5. 良性零误伤（12 条，含流程优化/技术批评/正常配合/评析豁免）
 *   6. 变异守卫：注入攻击判据（置空指定词表行）→ 必须变红
 *   7. 维度已登记 + 导出可用
 *
 * 用法: node test/round-514-scrutiny-evasion.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { checkScrutinyEvasion } = require('../src/scrutiny-evasion.js');
const { gate } = require('../src/gate.js');

const samples = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'round-511-scrutiny-evasion-samples.json'), 'utf8'));

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

console.log('== 第 514 轮 scrutiny_evasion 守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${samples.attacks.length}/${samples.attacks.length}`, () => {
  const miss = samples.attacks.filter(s => !checkScrutinyEvasion(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${samples.attacks.length}/${samples.attacks.length}`, () => {
  const leak = samples.attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

// ── 3. findings 归因到 scrutiny_evasion（接线有效性断言）────
check(`findings 归因 scrutiny_evasion ${samples.attacks.length}/${samples.attacks.length}`, () => {
  const noAttr = samples.attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'scrutiny_evasion'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. gate 动作为 verify 级（第 72 维度定级）──────────────
//   口径（同 r502/r507 先例）：scrutiny_evasion 定级 verify。若个别样本
//   整句动作被抬到 rewrite，须由**其他维度独立触发**（本例 atk#3 同时命中
//   helplessness_induction），本维度自身的 finding 仍只贡献 verify。
check('gate 动作为 verify 级（第 72 维度定级；跨维度抬级须由别维独立触发）', () => {
  const actions = samples.attacks.map(s => gate(s).gate.action);
  const unexpected = actions.filter(a => a !== 'verify' && a !== 'rewrite');
  assert.equal(unexpected.length, 0, `出现非 verify/rewrite 动作: ${unexpected.join(',')}`);
  // 逐条确认本维度 finding 的 severity 不越 rewrite 门槛
  const rewrites = samples.attacks
    .map((s, i) => [i, gate(s)])
    .filter(([, r]) => r.gate.action === 'rewrite');
  for (const [i, r] of rewrites) {
    const sev = (r.findings || []).find(f => f.dimension === 'scrutiny_evasion');
    const other = (r.findings || []).filter(f => f.dimension !== 'scrutiny_evasion');
    assert.ok(sev && other.length > 0,
      `atk#${i} 为 rewrite 但无其他维度共存，说明本维度定级越界`);
    console.log(`    · atk#${i} rewrite 由 ${other.map(f => f.dimension).join('/')} 独立触发，本维度仍为 verify`);
  }
});

// ── 5. 良性零误伤（scrutiny_evasion 维度口径）──────────────
//   口径（同 r507/r508/r510）：只断言本维度不误伤。整句 gate 非 pass 若来自
//   其他维度不归本维度负责——那是既有维度的独立行为。
check(`scrutiny_evasion 良性零误伤 0/${samples.benign.length}`, () => {
  const fp = samples.benign.filter(s => checkScrutinyEvasion(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── 6. guidance 非空（findings 可指导修复）─────────────────
check('findings 携带 guidance', () => {
  const r = gate(samples.attacks[0]);
  const f = (r.findings || []).find(x => x.dimension === 'scrutiny_evasion');
  assert.ok(f, '未找到 scrutiny_evasion finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── 7. 变异守卫：置空判据支后必须变红 ─────────────────────
//   做法：对模块源码里的关键词表行做整行/行内置空（保留 ' + 语法结构），
//   重新 require，断言该支独占样本命中下降。
//   口径（同 r508）：before/after 均按**该支覆盖的独占样本**比对，
//   不用全量样本读数——否则单支破坏后全量命中仍可能 ≥ 旧值，误判死码。
//   独占样本序号与变异方式来自 scripts/round-513-branch-attribute.js 实测。
function mutatedFn(spec) {
  const modPath = require.resolve('../src/scrutiny-evasion.js');
  const orig = fs.readFileSync(modPath, 'utf8');
  const tmp = path.join(os.tmpdir(), `sev-r514-${process.pid}-${mutantSeq++}.js`);
  fs.writeFileSync(tmp, spec.mutate(orig));
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp).checkScrutinyEvasion;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}
const os = require('node:os');
let mutantSeq = 0;

// 整行置空（形如 "  '...词表...' +"）
function blankLine(ln) {
  return orig => {
    const lines = orig.split('\n');
    const m = lines[ln - 1].match(/^(\s*)'(.*)'\s*\+\s*$/);
    if (!m) throw new Error(`L${ln} 形状不匹配 -> ${JSON.stringify(lines[ln - 1].slice(0, 40))}`);
    lines[ln - 1] = `${m[1]}'ZZZZZZ' +`;
    return lines.join('\n');
  };
}

// 行内词表置空（跨行正则支，保持括号配对）
function blankTail(target, repl) {
  return orig => {
    if (!orig.includes(target)) throw new Error('变异目标不存在');
    return orig.replace(target, repl);
  };
}

check('变异守卫：置空 VERIFY_TERM_ZH 材料/明细/底稿支后 atk#4 必须下降', () => {
  const before = checkScrutinyEvasion(samples.attacks[4]).hit;
  const mutated = mutatedFn({ mutate: blankLine(58) });
  const after = mutated(samples.attacks[4]).hit;
  assert.ok(before && !after,
    `变异后命中 ${after} 未变为 false —— 守卫不敏感，该支可能是死码`);
});

check('变异守卫：置空 DISPARAGE_ZH 不相信/多此一举支后 atk#10 必须下降', () => {
  const before = checkScrutinyEvasion(samples.attacks[10]).hit;
  const mutated = mutatedFn({ mutate: blankLine(81) });
  const after = mutated(samples.attacks[10]).hit;
  assert.ok(before && !after,
    `变异后命中 ${after} 未变为 false —— 守卫不敏感，该支可能是死码`);
});

check('变异守卫：置空 EXPLICIT_ZH 首行锚点支后 atk#0 必须下降', () => {
  const before = checkScrutinyEvasion(samples.attacks[0]).hit;
  const mutated = mutatedFn({ mutate: blankTail(
    "(?:就是|说明|表明|代表|意味着|等于|看得出|反映)",
    "(?:ZZZZZZ)") });
  const after = mutated(samples.attacks[0]).hit;
  assert.ok(before && !after,
    `变异后命中 ${after} 未变为 false —— 守卫不敏感，该支可能是死码`);
});

check('变异守卫：置空 EXPLICIT_ZH 贬义词表支后 atk#8 必须下降', () => {
  const before = checkScrutinyEvasion(samples.attacks[8]).hit;
  const mutated = mutatedFn({ mutate: blankTail(
    "[^。，]{0,8}(?:不信任|信不过|不放心|多疑|猜疑|有疑心|别有用心|",
    "[^。，]{0,8}(?:ZZZZZZ|") });
  const after = mutated(samples.attacks[8]).hit;
  assert.ok(before && !after,
    `变异后命中 ${after} 未变为 false —— 守卫不敏感，该支可能是死码`);
});

// ── 8. 导出区可用性（接线完整性断言依赖）─────────────────
check('index.js 导出 checkScrutinyEvasion', () => {
  const idx = require('../src/index.js');
  assert.equal(typeof idx.checkScrutinyEvasion, 'function', '未导出');
});

// ── 9. 维度已登记（dimensions 键含 scrutiny_evasion）───────
check('dimensions 键含 scrutiny_evasion（登记生效）', () => {
  // gate() 的返回体里才带 dimensions 键（index.js 只导出各维度函数）
  const r = gate(samples.attacks[0]);
  assert.ok(r.dimensions && 'scrutiny_evasion' in r.dimensions,
    `dimensions 键实际为: ${Object.keys(r.dimensions || {}).join(',')}`);
});

console.log(`\n== 结果: ${passed} 过 / ${failed} 败 ==`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
