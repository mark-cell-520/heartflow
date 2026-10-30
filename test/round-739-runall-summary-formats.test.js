/**
 * 第 739 轮守卫：run-all 汇总行解析的格式族扩容（r739）
 *
 * 背景：全量回归长期有 49~56 个测试文件落进「未输出『N 通过, M 失败』结果行」桶。
 * r739 用探针（scripts/tmp-739-probe-unparsed.js，轮末已删）把 49 个文件的完整
 * stdout 落盘到 data/tmp-739-unparsed/，逐份读完后归类出 9 种汇总格式，其中
 * 6 族从未被 runner 认识。修法：解析器抽成单一来源 test/_summary-parse.js，
 * run-all.js 与 r311 契约守卫共用。
 *
 * 本测试的样本全部取自那 49 份真实 stdout（硬编码进来看，不依赖 tmp 目录）：
 *   round-507/510/514/521/524/530/534/537/547/565/567/570/582/583/586/599/644
 *     → 「N 过 / M 败」
 *   round-606 → 「通过 N / 失败 M」
 *   round-634 → 「pass=N fail=M」
 *   round-629/643 → RESULT{…} / 裸 { "pass": N }
 *   round-436×2/437 → 「N pass / M verify」（verify 是 gate 动作，不是测试失败）
 *   round-417/428/443/447/479/480/481/482/488/491/493/496/574/v680×2/path-guard
 *     → 显式全绿措辞
 *   round-551/no-silent-skip → ✅ 通过标记单行
 *
 * 三条钉死的纪律：
 *   ① 数字族（有通过数+失败数）优先于语义族，且失败数必须透出不许吞；
 *   ② 没有失败数的格式一律按 0 失败计，取不到通过数按 1 计（不编数字）；
 *   ③ 一族都不认仍返回 SILENT_FAIL —— 兜底不许被新族吃掉。
 *
 * 运行：node test/round-739-runall-summary-formats.test.js
 */
'use strict';

const path = require('path');
const assert = require('assert');
const fs = require('fs');
const { parseSummary } = require('./_summary-parse.js');

const ROOT = path.join(__dirname, '..');
const RUN_ALL = fs.readFileSync(path.join(ROOT, 'test', 'run-all.js'), 'utf8');

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); console.log('  ✗ ' + name + '\n    ' + e.message); }
}

// ── A 段：新增 6 族的真实样本（逐族至少 2 条，全部来自探针落盘 stdout）────────
t('A1 cn-short「N 过 / M 败」三种书写变体', () => {
  for (const [out, want] of [
    ['     ✅ 变异守卫：破坏 SHIFT_ZH 换算法支后该支独占样本必须下降\n\n== 结果: 10 过 / 0 败 ==\n', 10],
    ['   ✅ 变异守卫：置空 GUARD_EN 后英文豁免族必须由 miss 转 hit\n\n   结果：14 过 / 0 败\n', 14],
    ['r583 exclusive_trust 收口守卫：13 过 / 0 败（共 54 项）\n', 13],
    ['═══ G 节：接口登记 ═══\n\n   结果: 61 过 / 0 败, 共 61 个\n', 61],
  ]) {
    const p = parseSummary(out);
    assert.strictEqual(p.kind, 'cn-short', '未被认成 cn-short: ' + JSON.stringify(p));
    assert.strictEqual(p.passed, want);
    assert.strictEqual(p.failed, 0);
  }
});

t('A2 cn-order「通过 N / 失败 M」', () => {
  const p = parseSummary('   ✓ D5 12 条路由逐条 dispatch 零内部故障（含默认空实参）\n\n   === 结果 ===\n   通过 26 / 失败 0\n');
  assert.strictEqual(p.kind, 'cn-order');
  assert.strictEqual(p.passed, 26);
  assert.strictEqual(p.failed, 0);
});

t('A3 kv「pass=N fail=M」', () => {
  const p = parseSummary('{"ts":"2026-10-30T11:05:53.934Z","module":"init","event":"KnowledgeSubsystem 加载成功"}\n[r634 dao-dispatch] pass=32 fail=0\n');
  assert.strictEqual(p.kind, 'kv');
  assert.strictEqual(p.passed, 32);
  assert.strictEqual(p.failed, 0);
});

t('A4 json 形：RESULT{…} 与行首裸 { 都认（跨行可匹配）', () => {
  const inline = 'RESULT{"pass":61,"fail":0,"failures":[],"dispatchable":6,"methodCount":6,"instrRouteCount":8}\n';
  const p1 = parseSummary(inline);
  assert.strictEqual(p1.kind, 'json');
  assert.strictEqual(p1.passed, 61);
  assert.strictEqual(p1.failed, 0);
  const bare = '{\n "pass": 13,\n "fail": 0,\n "total": 13,\n "failed": [],\n "all": [\n  {\n   "name": "实例存在",\n   "pass": true,\n   "detail": ""\n  }\n ]\n}\n';
  const p2 = parseSummary(bare);
  assert.strictEqual(p2.kind, 'json');
  assert.strictEqual(p2.passed, 13);
  assert.strictEqual(p2.failed, 0);
});

t('A5 sample-pass「N pass / M verify」—— verify 是 gate 动作，不得计成失败', () => {
  const p = parseSummary('   良性读数引用 5/5 pass，模糊来源 4/4 仍判\n   ✅ round-436 vagueness 可定位读数豁免守卫通过（5 pass / 4 verify）\n');
  assert.strictEqual(p.kind, 'sample-pass');
  assert.strictEqual(p.passed, 5);
  assert.strictEqual(p.failed, 0, 'verify 数被当成失败数了');
});

t('A6 health-phrase 显式全绿措辞（6 种真实书写）', () => {
  for (const [out, phrase] of [
    ['   M2b 短路英文支调用点（hasChinese 恒真）: exit=1 ✅ 变红\n\n   r417 circular_restate: 全部通过\n', '全部通过'],
    ['path-guard tests...\npath-guard: ALL PASSED ✅\n', 'ALL PASSED'],
    ['   r447 result: failures=0\n   r447: ALL GREEN\n', 'ALL GREEN'],
    ['round-574-selective-minimization: ALL PASS\n', 'ALL PASS'],
    ['round-480 sunk_cost_nullified: 15 攻击命中 / 10 良性 0 误报 / 删条变异承重 / 还原健康\n', '0 误报'],
    ['round-493-manufactured-consent: 攻击 12/命中、良性 10/零误报、断言 52 全部通过\n', '零误报'],
  ]) {
    const p = parseSummary(out);
    assert.strictEqual(p.kind, 'health-phrase', '未被认成 health-phrase: ' + JSON.stringify(p));
    assert.strictEqual(p.phrase, phrase);
    assert.strictEqual(p.passed, 1, '取不到通过数时必须按 1 计，不许编');
    assert.strictEqual(p.failed, 0);
  }
});

t('A7 passline：✅ 行逐个计数（round-551 真实 11 行）', () => {
  const out = [
    '== 第 552 轮 tool_deflection 守卫测试（第 81 维度）==',
    '  ✅ 模块层攻击命中 12/12',
    '  ✅ gate 非 pass 12/12',
    '  ✅ findings 归因 tool_deflection 12/12',
    '  ✅ gate 动作为 rewrite 级（第 81 维度定级）',
    '  ✅ tool_deflection 良性零误伤 0/14',
    '  ✅ tool_deflection 良性族 B（外部授意+接住责任）零误伤 0/5',
    '  ✅ tool_deflection 良性族 D（豁免层依赖）零误伤 0/5',
    '  ✅ findings 携带 guidance',
    '  ✅ 变异守卫：置空 TOOL_ZH（B1）后攻击必须由 hit 变 miss',
    '  ✅ 变异守卫：置空 CUT_ZH（B2）后中文攻击必须由 miss 变 hit',
    '  ✅ 变异守卫：置空 EXEMPT_ZH（豁免层）后良性族 D 必须由 miss 转 hit',
  ].join('\n') + '\n';
  const p = parseSummary(out);
  assert.strictEqual(p.kind, 'passline');
  assert.strictEqual(p.passLines, 11, '✅ 行必须逐行计数（漏 g flag 会恒为 1）');
});

t('A8 passline：PASS 行仍逐个计数（存量行为不退化）', () => {
  const p = parseSummary('PASS version.test.js (module loads)\nPASS safe-fs.test.js (module loads)\nSKIP big-five.test.js (dep missing)\n');
  assert.strictEqual(p.kind, 'passline');
  assert.strictEqual(p.passLines, 2);
  assert.strictEqual(p.skipLines, 1);
});

// ── B 段：回归 —— 存量三族的判定一个字都不能变 ────────────────────────────
t('B1 standard「N 通过, M 失败」与英文版不变', () => {
  const a = parseSummary('测试结果: 13 通过, 0 失败, 共 13 个');
  assert.strictEqual(a.kind, 'standard');
  assert.strictEqual(a.passed, 13);
  assert.strictEqual(a.failed, 0);
  const b = parseSummary('测试结果: 5 passed, 1 failed, 共 6 个');
  assert.strictEqual(b.kind, 'standard');
  assert.strictEqual(b.failed, 1);
});

t('B2 ratio 分数式不变（两支各自的真实形状）', () => {
  const a = parseSummary('  通过 13 / 13 个\n');
  assert.strictEqual(a.kind, 'ratio');
  assert.strictEqual(a.passed, 13);
  assert.strictEqual(a.failed, 0);
  const b = parseSummary('  合计 12 / 15\n');
  assert.strictEqual(b.kind, 'ratio');
  assert.strictEqual(b.passed, 12);
  assert.strictEqual(b.failed, 3);
});

t('B3 一族都不认仍返回 SILENT_FAIL（兜底没被新族吃掉）', () => {
  for (const out of ['', '引擎加载中...\n一些无格式的输出\n', 'The system went down yesterday.\n']) {
    assert.strictEqual(parseSummary(out).kind, 'SILENT_FAIL', '无格式输出未被判静默: ' + JSON.stringify(out));
  }
});

// ── C 段：失败数必须透出，不许被任何新族吞掉 ─────────────────────────────
t('C1 新族同样透出失败数', () => {
  const p = parseSummary('== 结果: 24 过 / 3 败 ==');
  assert.strictEqual(p.kind, 'cn-short');
  assert.strictEqual(p.failed, 3, 'cn-short 吞了失败数');
  const q = parseSummary('通过 26 / 失败 2');
  assert.strictEqual(q.failed, 2, 'cn-order 吞了失败数');
  const r = parseSummary('[r634 dao-dispatch] pass=32 fail=4');
  assert.strictEqual(r.failed, 4, 'kv 吞了失败数');
  const s = parseSummary('RESULT{"pass":61,"fail":2}');
  assert.strictEqual(s.failed, 2, 'json 吞了失败数');
});

t('C2 run-all.js 的 err 分支仍用主正则粗判（新格式洗不白崩溃）', () => {
  // 非零退出的文件在解析之前就被 err 分支拦下，只有主正则能放行进解析。
  assert.ok(RUN_ALL.indexOf('if (!/(\\d+) 通过, (\\d+) 失败/.test(out))') !== -1,
    'run-all.js err 分支的主正则粗判被删 —— 非零退出会被新格式洗成通过');
  assert.ok(RUN_ALL.indexOf("require('./_summary-parse.js')") !== -1,
    'run-all.js 不再引用共享解析器');
});

// ── D 段：优先级 —— 数字族必须先于语义族 ─────────────────────────────────
t('D1 同一输出含 sample-pass 与 health-phrase 时走数字族', () => {
  // round-436 真实输出：既含「7 pass / 4 verify」又含「守卫通过」。
  // 若 health-phrase 抢先，通过数会被压成 1。
  const p = parseSummary('   良性 7/7 pass，攻击 4/4 被拦\n   ✅ round-436 双语可定位语域豁免守卫通过（7 pass / 4 verify）\n');
  assert.strictEqual(p.kind, 'sample-pass', '数字族被语义族抢先: ' + JSON.stringify(p));
  assert.strictEqual(p.passed, 7);
});

t('D2 同一输出含 cn-short 与 health-phrase 时走数字族', () => {
  const p = parseSummary('   ✅ 还原校验：源码与变异前一致\n   ✅ round-443 守卫通过\n\n== 结果: 22 过 / 0 败 ==\n');
  assert.strictEqual(p.kind, 'cn-short');
  assert.strictEqual(p.passed, 22);
});

// ── E 段：不救的形状（诚实边界：宁可少计，不编数字）──────────────────────
t('E1 零输出仍判 SILENT_FAIL（存量 MCP 端口占用噪声，解析救不了）', () => {
  assert.strictEqual(parseSummary('').kind, 'SILENT_FAIL');
});

t('E2 RESULT 无 pass/fail 键仍判 SILENT_FAIL（round-630 真实输出）', () => {
  const out = 'RESULT{"reach":{"shouldApply":"OK","evaluateAll":"NA(Cannot read properties of unde)","detectConflict":"OK","getStats":"OK"},"inModules":true,"overrideBlocked":"0/5","benignPassed":"0/4","conflictFound":0,"mutantEscape":"0/5"}\n';
  assert.strictEqual(parseSummary(out).kind, 'SILENT_FAIL',
    '给没有 pass/fail 键的 RESULT 编了数字 —— 违反「不编数字」纪律');
});

// ── F 段：稳定性与接线 ─────────────────────────────────────────────────
t('F1 连续两次调用结果一致（防带 g 正则的 lastIndex 漂移）', () => {
  const out = '  ✅ a\n  ✅ b\n  ✅ c\n';
  const first = parseSummary(out);
  const second = parseSummary(out);
  assert.deepStrictEqual(first, second);
  assert.strictEqual(first.passLines, 3);
});

t('F2 run-all.js 打印新族识别结果（不许悄悄改数字）', () => {
  assert.ok(RUN_ALL.indexOf('[解析:') !== -1, 'run-all.js 没有打印解析出的格式族');
  assert.ok(RUN_ALL.indexOf("l.includes('败')") !== -1, 'keep 过滤器没补「败」——新格式原文会被滤掉');
});

t('F3 r311 契约守卫与 run-all 共用同一份解析器（防副本漂移）', () => {
  const r311 = fs.readFileSync(path.join(ROOT, 'test', 'runall-summary-contract-round311.test.js'), 'utf8');
  assert.ok(r311.indexOf("require('./_summary-parse.js')") !== -1,
    'r311 契约守卫又回到了字面重写副本 —— 判定与契约会再次漂移');
  assert.ok(!/function parseSummary\(out\)\s*\{\s*\n\s*let m = out\.match/.test(r311),
    'r311 里仍有内联 parseSummary 实现');
});

console.log('═══════════════════════════════════════');
console.log('r739 run-all 汇总行格式族守卫');
console.log('═══════════════════════════════════════');
console.log('  通过 ' + passed + ' / ' + (passed + failed));
if (failed) {
  console.log('  失败 ' + failed + ':');
  for (const f of failures) console.log('    ✗ ' + f);
  process.exitCode = 1;
} else {
  console.log('  ✅ 全绿');
}
console.log('测试结果: ' + passed + ' 通过, ' + failed + ' 失败, 共 ' + (passed + failed) + ' 个');
