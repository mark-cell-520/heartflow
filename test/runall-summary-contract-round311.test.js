/**
 * 第 311 轮守卫：run-all 汇总行契约（防静默测试复活）
 *
 * 背景：第 309/310/311 轮连续三轮的 run-all 失败，全都不是断言失败，
 * 而是测试文件跑完后 stdout 缺「N 通过, M 失败」成对汇总行，被
 * test/run-all.js 的 runChild() 判为静默（SILENT_FAIL），各计 1 个失败。
 * 实测证据（scratch/probe311-parse.js）：
 *   decision-channel-round308.test.js  单跑 13/13 exit=0  解析=SILENT_FAIL
 *   pattern-detector-jitter-round308.test.js 单跑 32/32 exit=0 解析=SILENT_FAIL
 *
 * 本守卫钉三件事：
 *   ① 已修复的两个文件现在必须被 run-all 的解析公式判为 standard（不再静默）；
 *   ② 解析公式本身按原文等价重写一遍（删 src 里任一支，这里必须能抓到）；
 *   ③ 分数式（「通过 N / M」）单独出现时必须是静默——证明②不是摆设。
 *
 * [v6.8.94 / r739] ②的做法已废止：本测试原先在这里字面重写一份解析公式当契约，
 * r739 给 run-all.js 新增 6 族格式后，那份副本立刻与真实行为漂移（副本判
 * SILENT_FAIL、实现已认出）——「诊断与判定必须是同一个不变式的两半」的翻版。
 * 因此改为 require 同一份实现 test/_summary-parse.js：契约守卫从此不可能与
 * 判定漂移，B 段改钉「共享模块仍在、且被 run-all.js 引用」。
 *
 * 运行：node test/runall-summary-contract-round311.test.js
 */
'use strict';

const path = require('path');
const assert = require('assert');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { parseSummary } = require('./_summary-parse.js');

const ROOT = path.join(__dirname, '..');
const RUN_ALL = fs.readFileSync(path.join(ROOT, 'test', 'run-all.js'), 'utf8');
const SUMMARY_SRC = fs.readFileSync(path.join(ROOT, 'test', '_summary-parse.js'), 'utf8');

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); console.log('  ✗ ' + name + '\n    ' + e.message); }
}

// ── [v6.8.94] 解析公式改为单一来源，不再字面重写 ────────────────────────────
// （原副本见 git history；它会被任何一次格式新增变成谎言，故删除。）

function runTestFile(rel) {
  return execFileSync('node', [path.join(ROOT, 'test', rel)], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
}

// ── A 段：两个 r308 文件必须已被修复（单跑 + 全案解析双向验证） ────────────
t('A1 decision-channel-round308 单跑输出标准汇总行（修复目标）', () => {
  const out = runTestFile('decision-channel-round308.test.js');
  const p = parseSummary(out);
  assert.strictEqual(p.kind, 'standard', '仍未被解析成标准汇总: ' + JSON.stringify(p));
  assert.strictEqual(p.failed, 0, '汇总行报了失败: ' + p.failed);
  assert.strictEqual(p.passed, 13, '断言数应为 13: ' + p.passed);
});

t('A2 pattern-detector-jitter-round308 单跑输出标准汇总行（修复目标）', () => {
  const out = runTestFile('pattern-detector-jitter-round308.test.js');
  const p = parseSummary(out);
  assert.strictEqual(p.kind, 'standard', '仍未被解析成标准汇总: ' + JSON.stringify(p));
  assert.strictEqual(p.failed, 0, '汇总行报了失败: ' + p.failed);
  assert.strictEqual(p.passed, 32, '断言数应为 32: ' + p.passed);
});

// ── B 段：三段解析必须仍在（删任一支这里必须变红） ────────────────────────
// [v6.8.94] 钉的对象从「run-all.js 里的内联正则」改为「共享模块 _summary-parse.js」，
// 外加一条「run-all.js 确实引用它」——否则契约守卫会守着一份没人用的代码。
t('B1 共享模块仍含「N 通过, M 失败」标准格式正则', () => {
  assert.ok(
    SUMMARY_SRC.indexOf('(?:通过|passed)') !== -1,
    '_summary-parse.js 的标准汇总正则(通过|passed)被删/改 —— 静默判定会蔓延'
  );
  assert.ok(
    SUMMARY_SRC.indexOf('(?:失败|failed)') !== -1,
    '_summary-parse.js 的标准汇总正则(失败|failed)被删/改'
  );
});

t('B1b run-all.js 确实引用共享解析器（防止契约守的是死代码）', () => {
  assert.ok(
    RUN_ALL.indexOf("require('./_summary-parse.js')") !== -1,
    'run-all.js 不再引用 _summary-parse.js —— 契约与判定已脱钩'
  );
  assert.ok(RUN_ALL.indexOf('parseSummary(out)') !== -1, 'run-all.js 的主匹配调用被删');
});

t('B2 共享模块仍含静默计失败的兜底（防「不报行就永久隐形」）', () => {
  assert.ok(/静默/.test(SUMMARY_SRC), '静默兜底注释/逻辑被删');
  assert.ok(RUN_ALL.indexOf('未输出「N 通过, M 失败」结果行') !== -1, '静默失败的原因串被删');
});

t('B3 共享模块仍含分数式兜底（N/M passed 家族）', () => {
  assert.ok(SUMMARY_SRC.indexOf('N/M passed') !== -1, '分数式兜底注释被删');
  assert.ok(SUMMARY_SRC.indexOf('合计') !== -1, '合计 N/M 分支被删');
  assert.ok(SUMMARY_SRC.indexOf('SKIP') !== -1 && SUMMARY_SRC.indexOf('PASS') !== -1,
    'PASS/SKIP 裸跑型兜底被删');
});

// ── C 段：解析公式不是摆设 —— 负例（删条必须变红的那三条） ──────────────────
t('C1 纯分数式不得被判 standard（证明本守卫的分辨力，非恒绿）', () => {
  const onlyRatio = '═══════\n  通过 13 / 13\n  ✅ 全绿\n';
  const p = parseSummary(onlyRatio);
  // [v6.8.94] 原断言是 SILENT_FAIL；新增 ✅ 行族后这行输出会被认成通过（1 个
  // ✅ 行）——这是有意的行为变化。保留的原命题是「分数式不是标准汇总」，
  // 因此这里只钉 kind 不是 standard/ratio（数字仍不被编造）。
  assert.notStrictEqual(p.kind, 'standard', '分数式竟被当成标准汇总');
  assert.notStrictEqual(p.kind, 'ratio', '分数式竟被当成分数式汇总');
});

t('C1b 什么格式都没有时仍判 SILENT_FAIL（兜底没被新族吃掉的证明）', () => {
  assert.strictEqual(parseSummary('引擎加载中...\n一些无格式的输出\n').kind, 'SILENT_FAIL',
    '无格式输出未被判静默 —— 兜底失效');
});

t('C2 标准成对行被解析出具体数字', () => {
  const standard = '测试结果: 13 通过, 0 失败, 共 13 个\n';
  const p = parseSummary(standard);
  assert.strictEqual(p.kind, 'standard');
  assert.strictEqual(p.passed, 13);
  assert.strictEqual(p.failed, 0);
});

t('C3 「N passed, M failed」英文汇总同样被识别', () => {
  const p = parseSummary('测试结果: 5 passed, 1 failed, 共 6 个');
  assert.strictEqual(p.kind, 'standard');
  assert.strictEqual(p.failed, 1, '失败数必须透出，不能吞');
});

// ── D 段：修复的可逆性 —— 把汇总行从输出里抠掉，必须重新变静默 ─────────────
t('D1 抠掉全部可识别格式后回到 SILENT_FAIL（注入-删条-变红的自证）', () => {
  const good = runTestFile('decision-channel-round308.test.js');
  assert.notStrictEqual(parseSummary(good).kind, 'SILENT_FAIL', '修复后不该是静默');
  // [v6.8.94] stripped 必须把新族也一起抠掉（标准行 + ✅ 行 + 全绿措辞），
  // 否则 D 段测的是「新解析器救不回来」，不再是「删条即变红」。
  const stripped = good
    .split('\n')
    .filter(l => !/测试结果:\s*\d+\s*通过,\s*\d+\s*失败/.test(l))
    .filter(l => !/^\s*✅/.test(l))
    .filter(l => !/全绿|全部通过/.test(l))
    .join('\n');
  assert.strictEqual(parseSummary(stripped).kind, 'SILENT_FAIL',
    '删掉全部汇总格式后未被判静默 —— 说明解析与本修复无关（守卫失效）');
});

t('D2 同样手法对 jitter 文件成立', () => {
  const good = runTestFile('pattern-detector-jitter-round308.test.js');
  const stripped = good
    .split('\n')
    .filter(l => !/测试结果:\s*\d+\s*通过,\s*\d+\s*失败/.test(l))
    .filter(l => !/^\s*✅/.test(l))
    .filter(l => !/全绿|全部通过/.test(l))
    .join('\n');
  assert.strictEqual(parseSummary(stripped).kind, 'SILENT_FAIL', '删行后未判静默');
});

// ── E 段：防回退 —— 修好的汇总行必须真的写在两个文件里 ────────────────────
t('E1 两个文件源码里都含标准汇总 console.log（防将来被「优化」掉）', () => {
  for (const f of ['decision-channel-round308.test.js', 'pattern-detector-jitter-round308.test.js']) {
    const src = fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
    assert.ok(
      /console\.log\('测试结果: '\s*\+\s*passed\s*\+\s*' 通过, '\s*\+\s*failed\s*\+\s*' 失败/.test(src),
      f + ' 里没有标准汇总 console.log'
    );
  }
});

console.log('═══════════════════════════════════════');
console.log('run-all 汇总行契约守卫（第 311 轮）');
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
