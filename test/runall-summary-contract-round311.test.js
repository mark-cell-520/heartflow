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
 * 运行：node test/runall-summary-contract-round311.test.js
 */
'use strict';

const path = require('path');
const assert = require('assert');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const RUN_ALL = fs.readFileSync(path.join(ROOT, 'test', 'run-all.js'), 'utf8');

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); console.log('  ✗ ' + name + '\n    ' + e.message); }
}

// ── 与 run-all.js runChild() 内等价的汇总行解析（不许调 src，纯字面守卫）────
function parseSummary(out) {
  let m = out.match(/(\d+)\s*(?:通过|passed)\s*[/,]?\s*(\d+)\s*(?:失败|failed)/);
  let ratio = null;
  if (!m) {
    const r = out.match(/(\d+)\s*\/\s*(\d+)\s*(?:passed|通过|tests?\b|个|条)/)
      || out.match(/合计\s*(\d+)\s*\/\s*(\d+)/);
    if (r) ratio = { passed: parseInt(r[1], 10), failed: Math.max(0, parseInt(r[2], 10) - parseInt(r[1], 10)) };
  }
  if (m) return { kind: 'standard', passed: parseInt(m[1], 10), failed: parseInt(m[2], 10) };
  if (ratio) return { kind: 'ratio', passed: ratio.passed, failed: ratio.failed };
  const passLines = (out.match(/^\s*PASS\b.*$/gm) || []).length;
  const skipLines = (out.match(/^\s*SKIP\b.*$/gm) || []).length;
  if (passLines > 0 || skipLines.length > 0) return { kind: 'passline', passLines, skipLines };
  return { kind: 'SILENT_FAIL' };
}

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

// ── B 段：run-all.js 的三段解析必须仍在（删任一支这里必须变红） ────────────
t('B1 run-all.js 仍含「N 通过, M 失败」标准格式正则', () => {
  // 用字面子串而非正则匹配，避开源码里反斜杠的转义层数问题。
  assert.ok(
    RUN_ALL.indexOf('(?:通过|passed)') !== -1,
    'run-all.js 的标准汇总正则(通过|passed)被删/改 —— 静默判定会蔓延'
  );
  assert.ok(
    RUN_ALL.indexOf('(?:失败|failed)') !== -1,
    'run-all.js 的标准汇总正则(失败|failed)被删/改'
  );
  assert.ok(
    RUN_ALL.indexOf('let m = out.match(') !== -1,
    'run-all.js 的主匹配语句被删'
  );
});

t('B2 run-all.js 仍含静默计失败的兜底（防「不报行就永久隐形」）', () => {
  assert.ok(/静默/.test(RUN_ALL), 'run-all.js 的静默兜底注释/逻辑被删');
  assert.ok(/未输出「N 通过, M 失败」结果行/.test(RUN_ALL), '静默失败的原因串被删');
});

t('B3 run-all.js 仍含分数式兜底（N/M passed 家族）', () => {
  assert.ok(RUN_ALL.indexOf('N/M passed') !== -1, '分数式兜底注释被删');
  assert.ok(RUN_ALL.indexOf('合计') !== -1, '合计 N/M 分支被删');
  assert.ok(RUN_ALL.indexOf('SKIP') !== -1 && RUN_ALL.indexOf('PASS') !== -1,
    'PASS/SKIP 裸跑型兜底被删');
});

// ── C 段：解析公式不是摆设 —— 负例（删条必须变红的那三条） ──────────────────
t('C1 纯分数式输出被判 SILENT_FAIL（证明本测试的分辨力，非恒绿）', () => {
  const onlyRatio = '═══════\n  通过 13 / 13\n  ✅ 全绿\n';
  assert.strictEqual(parseSummary(onlyRatio).kind, 'SILENT_FAIL', '分数式竟被当成标准汇总');
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
t('D1 抠掉标准汇总行后回到 SILENT_FAIL（注入-删条-变红的自证）', () => {
  const good = runTestFile('decision-channel-round308.test.js');
  assert.notStrictEqual(parseSummary(good).kind, 'SILENT_FAIL', '修复后不该是静默');
  const stripped = good
    .split('\n')
    .filter(l => !/测试结果:\s*\d+\s*通过,\s*\d+\s*失败/.test(l))
    .join('\n');
  assert.strictEqual(parseSummary(stripped).kind, 'SILENT_FAIL',
    '删掉汇总行后未被判静默 —— 说明解析与本修复无关（守卫失效）');
});

t('D2 同样手法对 jitter 文件成立', () => {
  const good = runTestFile('pattern-detector-jitter-round308.test.js');
  const stripped = good
    .split('\n')
    .filter(l => !/测试结果:\s*\d+\s*通过,\s*\d+\s*失败/.test(l))
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
