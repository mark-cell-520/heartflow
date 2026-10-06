/**
 * 第 537 轮守卫测试：第 78 维度 suffering_contest（苦难竞赛×比惨消诉族）
 *
 * 覆盖（12 组）：
 *   1. 模块层攻击命中（14 条）
 *   2. gate 层非 pass（真实判别管线）
 *   3. findings 归因到 suffering_contest（接线进 findings 的证据）
 *   4. gate 动作 verify 级（本维度定级；rewrite 须由其他维度独立触发）
 *   5. 良性误伤（模块层 / gate 层各 17 条 → 0）
 *   6. findings 携带 guidance
 *   7. 变异守卫：置空 seven 支 → 对应样本由 hit 变 miss
 *   8. 变异不得误伤相邻支
 *   9. 豁免守卫：置空 EXEMPT 后豁免样本由 miss 变 hit
 *  10. 维度已登记 + dimMap 键在场 + 导出可用
 *  11. 路由②（诉求取消）单独成立
 *  12. 首版注记锚点防回退（两种中文崩塌语序）
 *
 * 口径（同 r524/r530/r531/r534）：`new RegExp('')` 空模式恒匹配，
 * 故用 `(?!)` 负向前瞻做真置空。
 *
 * 用法: node test/round-537-suffering-contest.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { checkSufferingContest } = require('../src/suffering-contest.js');
const { gate } = require('../src/gate.js');

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

const attacks = [
  '我比你惨多了，你这点损失算什么。',
  '我连工作都快保不住了，你还有脸要说法？',
  '我付出的代价是你的十倍，别再叫了。',
  '你才遇到一次，我天天都在承受。',
  '我这半年都没睡过一个整觉，你抱怨这个？',
  '比起我的处境，你那些根本不值一提。',
  '我这段时间整夜失眠吃不下饭，你别再提了。',
  '我这一年里日复一日地扛着，你才受了点委屈也叫苦。',
  '我家里都快撑不住了，你计较这点事有意思吗？',
  'I have it far worse than you, so stop complaining.',
  'My losses are ten times yours; your grievance is nothing.',
  'You faced this once; I live with it every day.',
  'I have not slept in days — how much more do you want?',
  'I am about to lose my job over this; get over it.',
];

const benign = [
  '我们的处境不同，但你的损失需要单独计量。',
  '我承认我的压力，也承认你的诉求独立成立。',
  '两边都难，不等于你的那部分可以抵消。',
  '你的苦难是真实的，与我的处境无关也不能互相抵消。',
  '这是产品问题，我认领并列出赔付项。',
  '复盘时把错误归因到流程缺口，不针对个人。',
  'Your hardship is real on its own terms, separate from mine.',
  'Different situations, and your claim still stands.',
  'We compare notes without ranking whose pain is bigger.',
  'I feel awful, and separately the restitution plan is attached.',
  '你的损失需要单独计量，我这边也有压力。',
  '两边都难，我们分别复盘、逐条对齐。',
  '我压力很大，但不影响你的诉求独立核算。',
  '你的诉求独立成立，赔付照付。',
  '压力不能互相抵消，两边分开处理。',
  'Both sides are struggling, so we track every claim separately.',
  'Your grievance is real and stands on its own.',
];

// 逐支归属（scripts/round-537-branch-attr.js 实测）：
//   atk#0/#3/#4/#5/#7/#8 → SUFFER_ZH + OUTRANK_ZH（路由①）
//   atk#1               → SUFFER_ZH + OUTRANK_ZH
//   atk#2               → SUFFER_ZH + OUTRANK_ZH + CANCEL_ZH（双路）
//   atk#6               → SUFFER_ZH + CANCEL_ZH（路由②）
//   atk#9/#10/#11       → SUFFER_EN + OUTRANK_EN
//   atk#12/#13          → SUFFER_EN + CANCEL_EN（路由②）

console.log('== 第 537 轮 suffering_contest 守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${attacks.length}/${attacks.length}`, () => {
  const miss = attacks.filter(s => !checkSufferingContest(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${attacks.length}/${attacks.length}`, () => {
  const leak = attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

// ── 3. findings 归因 ──────────────────────────────────────
check(`findings 归因 suffering_contest ${attacks.length}/${attacks.length}`, () => {
  const noAttr = attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'suffering_contest'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. gate 动作 verify 级 ────────────────────────────────
check('gate 动作为 verify/rewrite 级（本维度 verify，跨维度抬级须由别维独立触发）', () => {
  const actions = attacks.map(s => gate(s).gate.action);
  const unexpected = actions.filter(a => a !== 'verify' && a !== 'rewrite');
  assert.equal(unexpected.length, 0, `出现非 verify/rewrite 动作: ${unexpected.join(',')}`);
  for (const [i, r] of attacks.map((s, i) => [i, gate(s)])) {
    if (r.gate.action !== 'rewrite') continue;
    const sev = (r.findings || []).find(f => f.dimension === 'suffering_contest');
    const other = (r.findings || []).filter(f => f.dimension !== 'suffering_contest');
    assert.ok(sev && other.length > 0,
      `atk#${i} 为 rewrite 但无其他维度共存，说明本维度定级越界`);
  }
});

// ── 5. 良性零误伤 ────────────────────────────────────────
check(`suffering_contest 良性零误伤 0/${benign.length}（模块层）`, () => {
  const fp = benign.filter(s => checkSufferingContest(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

check(`良性 gate 层本维度零归因 0/${benign.length}`, () => {
  const fp = benign.filter(s =>
    (gate(s).findings || []).some(f => f.dimension === 'suffering_contest'));
  assert.equal(fp.length, 0, `本维度在 gate 层误伤 ${fp.length} 条`);
});

check(`良性 gate 层全 pass ${benign.length}/${benign.length}`, () => {
  const fp = benign.filter(s => gate(s).gate.action !== 'pass');
  assert.equal(fp.length, 0, `良性样本非 pass ${fp.length} 条`);
});

// ── 6. guidance 非空 ────────────────────────────────────
check('findings 携带 guidance', () => {
  const r = gate(attacks[0]);
  const f = (r.findings || []).find(x => x.dimension === 'suffering_contest');
  assert.ok(f, '未找到 suffering_contest finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── 7. 变异守卫：置空指定支后必须变红 ────────────────────
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

function loadIsolated(src) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process,
                    console, Buffer, __filename: 'sc-isolated.js', __dirname: __dirname };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext(
    '(function(module, exports, require){' + src + '\nreturn module.exports;})',
    sandbox, { filename: 'sc-isolated.js' });
  return wrapper(sandbox.module, sandbox.module.exports, require);
}

const modPath = require.resolve('../src/suffering-contest.js');
const origSrc = fs.readFileSync(modPath, 'utf8');

function liveMutation(declName, sample) {
  const mutated = blankDecl(declName)(origSrc);
  const before = checkSufferingContest(sample).hit;
  const after = loadIsolated(mutated).checkSufferingContest(sample).hit;
  return { before, after };
}

check('活度：置空 SUFFER_ZH 后 atk#0 由 hit 变 miss（自我苦难宣告·中文）', () => {
  const r = liveMutation('SUFFER_ZH', attacks[0]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— SUFFER_ZH 支不敏感');
});

check('活度：置空 OUTRANK_ZH 后 atk#5 由 hit 变 miss（量级压过·中文）', () => {
  const r = liveMutation('OUTRANK_ZH', attacks[5]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— OUTRANK_ZH 支不敏感');
});

check('活度：置空 CANCEL_ZH 后 atk#6 由 hit 变 miss（诉求取消·中文）', () => {
  const r = liveMutation('CANCEL_ZH', attacks[6]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— CANCEL_ZH 支不敏感');
});

check('活度：置空 SUFFER_EN 后 atk#9 由 hit 变 miss（自我苦难宣告·英文）', () => {
  const r = liveMutation('SUFFER_EN', attacks[9]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— SUFFER_EN 支不敏感');
});

check('活度：置空 OUTRANK_EN 后 atk#10 由 hit 变 miss（量级压过·英文）', () => {
  const r = liveMutation('OUTRANK_EN', attacks[10]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— OUTRANK_EN 支不敏感');
});

check('活度：置空 CANCEL_EN 后 atk#12 由 hit 变 miss（诉求取消·英文）', () => {
  const r = liveMutation('CANCEL_EN', attacks[12]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— CANCEL_EN 支不敏感');
});

// 变异不得误伤相邻支
check('变异守卫：置空 OUTRANK_ZH 不误伤相邻支', () => {
  const m = blankDecl('OUTRANK_ZH')(origSrc);
  assert.ok(m.includes(`const OUTRANK_ZH = new RegExp('${BLANK_PATTERN}');`), 'OUTRANK_ZH 未被置空');
  assert.ok(m.includes('const OUTRANK_EN = new RegExp'), 'OUTRANK_EN 支被误伤');
  assert.ok(m.includes('const SUFFER_ZH = new RegExp'), 'SUFFER_ZH 支被误伤');
  assert.ok(m.includes('const SUFFER_EN = new RegExp'), 'SUFFER_EN 支被误伤');
  assert.ok(m.includes('const CANCEL_ZH = new RegExp'), 'CANCEL_ZH 支被误伤');
  assert.ok(m.includes('const EXEMPT_ZH = new RegExp'), 'EXEMPT_ZH 支被误伤');
});

// ── 9. 豁免守卫：置空 EXEMPT 后豁免样本由 miss 变 hit ──────
// 探针筛选用 scripts/round-537-exempt-probe3.js 实测：必须同时满足
//   ① 基线 miss；② 置空目标支后由 miss 变 hit；③ 置空另一支后仍 miss。
// 「两边分别复盘」→ 只被 EXEMPT_ZH 兜住；英文两句各命中一条。
const EXEMPT_PROBE_ZH = '我这半年都没睡过一个整觉，你也别再提了，两边分别复盘。';
const EXEMPT_PROBE_EN = 'I have not slept in days, stop complaining, and your claim still stands.';
check('活度：置空 EXEMPT_ZH 后豁免样本由 miss 变 hit（豁免支敏感·中文）', () => {
  const mutated = blankDecl('EXEMPT_ZH')(origSrc);
  const after = loadIsolated(mutated).checkSufferingContest(EXEMPT_PROBE_ZH).hit;
  assert.ok(!checkSufferingContest(EXEMPT_PROBE_ZH).hit, '豁免样本基线即命中 —— 样本选错');
  assert.ok(after, '置空 EXEMPT_ZH 后豁免样本仍为 miss —— 不由该支兜住，守卫无效');
});

check('活度：置空 EXEMPT_EN 后豁免样本由 miss 变 hit（豁免支敏感·英文）', () => {
  const mutated = blankDecl('EXEMPT_EN')(origSrc);
  const after = loadIsolated(mutated).checkSufferingContest(EXEMPT_PROBE_EN).hit;
  assert.ok(!checkSufferingContest(EXEMPT_PROBE_EN).hit, '豁免样本基线即命中 —— 样本选错');
  assert.ok(after, '置空 EXEMPT_EN 后豁免样本仍为 miss —— 不由该支兜住，守卫无效');
});

// ── 10. 导出区可用性 ─────────────────────────────────────
check('index.js 导出 checkSufferingContest', () => {
  const idx = require('../src/index.js');
  assert.equal(typeof idx.checkSufferingContest, 'function', '未导出');
});

check('dimensions 键含 suffering_contest（登记生效）', () => {
  const r = gate(attacks[0]);
  assert.ok(r.dimensions && 'suffering_contest' in r.dimensions,
    `dimensions 键实际为: ${Object.keys(r.dimensions || {}).slice(-8).join(',')}`);
});

// ── 11. 路由②（诉求取消）单独成立 ────────────────────────
// OUTRANK_ZH 末支 `(?:这|这事|这个|...)` 是泛宾语（为保证「你这点损失算什么」
// 一类可命中而保留），zh 样本即使只走路由②也会被它命中；英文侧
// OUTRANK_EN 无对应泛支，故 atk#13 是纯粹的 SUFFER × CANCEL 命中。
// 这里同时断言 CANCEL 命中 + SUFFER 命中（证明该族成立的两要素齐备）。
check('路由②（SUFFER × CANCEL）成立，两要素齐备', () => {
  const I = require('../src/suffering-contest.js').__internals();
  for (const s of [attacks[6], attacks[13]]) {
    assert.ok(I.SUFFER_ZH.test(s) || I.SUFFER_EN.test(s), 'SUFFER 未命中');
    assert.ok(I.CANCEL_ZH.test(s) || I.CANCEL_EN.test(s), 'CANCEL 未命中');
  }
});

// 路由②英文样本必须不依赖 OUTRANK_EN（证明英文路由②独立成立）
check('路由②英文样本不依赖 OUTRANK_EN', () => {
  const I = require('../src/suffering-contest.js').__internals();
  assert.ok(!I.OUTRANK_EN.test(attacks[13]), 'atk#13 被 OUTRANK_EN 命中，非纯路由②样本');
  assert.ok(I.SUFFER_EN.test(attacks[13]) && I.CANCEL_EN.test(attacks[13]),
    'atk#13 缺少 SUFFER_EN 或 CANCEL_EN');
});

// ── 12. 首版注记锚点防回退 ─────────────────────────────
// r536 三轮逐支诊断修掉的句法形状：状语前置崩塌 / 动词紧跟处境词。
check('两种中文崩塌语序锚点在源码中齐备（防回退）', () => {
  const anchors = [
    // 语序①：状语前置、崩塌动词后置 —— "我家都快撑不住了"
    '(?:都|也|眼看|快|几乎|差点|快要|即将)',
    // 语序②：崩塌动词紧跟处境词 —— "保不住工作"
    '(?:工作|饭碗|职位|生活|家庭|婚姻|房子|命|开销|开支|日子)',
  ];
  const norm = s => s.split(String.fromCharCode(92)).join('');
  for (const [i, a] of anchors.entries()) {
    assert.ok(norm(origSrc).includes(norm(a)), `崩塌语序 #${i} 锚点缺失 —— 疑似被回退`);
  }
});

console.log(`\n== 结果: ${passed} 过 / ${failed} 败 ==`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
