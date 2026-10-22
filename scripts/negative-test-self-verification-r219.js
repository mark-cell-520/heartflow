#!/usr/bin/env node
/**
 * scripts/negative-test-self-verification-r219.js
 * 第 219 轮负例守卫：把本轮新增的接线逐条"删掉/改坏"，验证测试必须变红。
 *
 * 纪律（216/217/218 轮沿用）：守卫不能被触发就不是守卫。
 * 只报红/绿计数与变异标识，不贴样本原文。
 *
 * 变异清单：
 *   M1 删 _selfVerificationIssues 信号条目        → gate 不再 verify（应红）
 *   M2 删 healthTrigger 分支（对象走默认分支）     → healthy 也触发（应红）
 *   M3 删 _selfVerificationIssues 赋值             → 字段不存在（应红）
 *   M4 report 段 _buildSelfVerificationSection 返 null → 报告段消失（应红）
 *   M5 report 不过滤 counterfactual（issues 用全量）→ 噪声进 issues（应红）
 *   M6 gate-verdict 只读 _selfVerification（不过滤）→ 噪声触发 verify（应红）
 *
 * 无效变异（must stay green，作为对照证明测试不是"逢改必红"）：
 *   N1 改注释文字                                   → 应全绿
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TEST = 'test/self-verification-consumers-r219.test.js';
const GV = 'src/gate-verdict.js';
const HF = 'src/core/heartflow.js';
const RG = 'src/report/report-generator.js';

function backup(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function restore(file, content) { fs.writeFileSync(path.join(ROOT, file), content); }
function runTest() {
  try {
    const out = execSync(`timeout 100 node ${TEST}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return /(\d+) 通过, (\d+) 失败/.test(out) ? 'GREEN' : 'NO_RESULT_LINE';
  } catch (e) {
    return 'RED';
  }
}

const results = [];
function mutate(name, file, transform, expect) {
  const original = backup(file);
  const mutated = transform(original);
  if (mutated === original) {
    results.push({ name, status: 'SKIP_NOOP', note: '变换未改变文件（old_string 未命中）' });
    restore(file, original);
    return;
  }
  restore(file, mutated);
  const status = runTest();
  restore(file, original);
  const ok = status === expect;
  results.push({ name, status, expect, ok });
}

// ── M1: 删 _selfVerificationIssues 信号条目 ──
mutate('M1 删 gate-verdict 自验证信号条目', GV, (s) =>
  s.replace(
    /  \{ key: '_selfVerificationIssues'[^\n]*\n/,
    ''
  ), 'RED');

// ── M2: 删 healthTrigger 分支 ──
mutate('M2 删 healthTrigger 定向分支', GV, (s) =>
  s.replace(
    /  if \(Array\.isArray\(spec\?\.healthTrigger\) && typeof value === 'object'\) \{\n[\s\S]*?\n  \}\n/,
    ''
  ), 'RED');

// ── M3: 删 _selfVerificationIssues 赋值段 ──
mutate('M3 删 heartflow.js 自验证赋值段', HF, (s) =>
  s.replace(
    /          const _realIssues = \(sv\.issues \|\| \[\]\)\.filter[\s\S]*?\n        \}\n/,
    ''
  ), 'RED');

// ── M4: report 段直接返 null ──
mutate('M4 report 自验证段返 null', RG, (s) =>
  s.replace(
    /function _buildSelfVerificationSection\(src\) \{/,
    'function _buildSelfVerificationSection(src) {\n  return null; // 变异 M4'
  ), 'RED');

// ── M5: report 不过滤 counterfactual ──
mutate('M5 report 用全量 issues', RG, (s) =>
  s.replace(
    /      const realIssues = Array\.isArray\(src\._selfVerificationIssues\)\n        \? src\._selfVerificationIssues\n        : \[\];/,
    '      const realIssues = (sv && Array.isArray(sv.issues)) ? sv.issues : [];'
  ), 'RED');

// ── M6: gate 改读全量 _selfVerification ──
mutate('M6 gate 改读全量 issues', GV, (s) =>
  s.replace(
    /  \{ key: '_selfVerificationIssues'/,
    "  { key: '_selfVerification'"
  ), 'RED');

// ── N1: 只改注释（对照，应全绿）──
mutate('N1 只改注释文字（对照）', GV, (s) =>
  s.replace('// [v6.7.130] 健康状态触发', '// [v6.7.130] 健康状态触发（注释微调）')
, 'GREEN');

// ── 汇总 ──
console.log('=== 第 219 轮负例守卫（注入-删条-必须变红）===');
let real = 0, realOk = 0, ctrl = 0, ctrlOk = 0;
for (const r of results) {
  const isCtrl = r.name.startsWith('N');
  if (r.status === 'SKIP_NOOP') {
    console.log(`  [SKIP] ${r.name}: ${r.note}`);
    continue;
  }
  if (isCtrl) { ctrl++; if (r.ok) ctrlOk++; } else { real++; if (r.ok) realOk++; }
  console.log(`  ${r.ok ? 'OK  ' : 'FAIL'}  ${r.name}  →  ${r.status}（期望 ${r.expect}）`);
}
console.log(`\n变异守卫: ${realOk}/${real} 按预期变红/变绿`);
console.log(`对照组:   ${ctrlOk}/${ctrl} 按预期全绿`);
console.log(`\n负例测试结果: ${realOk + ctrlOk} 通过, ${real + ctrl - realOk - ctrlOk} 失败, 共 ${real + ctrl} 个`);
process.exit(realOk === real && ctrlOk === ctrl ? 0 : 1);
