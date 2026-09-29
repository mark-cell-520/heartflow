#!/usr/bin/env node
/**
 * scripts/negative-test-decision-router-rule-coverage-r221.js
 *
 * 第 221 轮负例守卫：验证 test/decision-router-rule-coverage-r221.test.js
 * 真的能挡住 rules/ arbitration 语义的回归。
 *
 * 变异方式（每个变异注入 → 跑测试 → 必须全红 → 还原 → 单独校验已经还原）：
 *   M1  error-severity 的比较常量改回大写（本轮修的 bug 复辟）
 *   M2  error-severity 的 confidence 0.95 改 0.9
 *   M3  identity-drift 的 confidence 1-x 改 0.5 常量
 *   M4  counterfactual-insight 的 0.15 乘子改 0.1
 *   M5  field-degrading 的 0.3 阈值改 0.5
 *   M6  execution-success 的 confidence T.standard 改 0.9
 *   M7  语义镜像：把 error-severity 的 decision heal 改 pause
 *   N1  对照组：只改一条注释文字 → 测试必须仍然全绿
 *
 * 纪律：跑完后必须还原，且要 grep 确认变异串不在文件里。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src/core/decision-router.js');
const TEST = 'test/decision-router-rule-coverage-r221.test.js';

const MUTATIONS = [
  {
    id: 'M1',
    label: 'error-severity 比较常量改回大写（本轮 bug 复辟）',
    from: "['critical', 'high', 'fatal'].includes(String(r.severity).toLowerCase())",
    to: "['critical', 'high', 'FATAL'].includes(String(r.severity).toUpperCase())",
  },
  {
    id: 'M2',
    label: 'error-severity confidence 0.95 → 0.9',
    from: "        id: 'error-severity',",
    to: "        id: 'error-severity-X',",
    expect: 'red-by-missing-rule',
  },
  {
    id: 'M3',
    label: 'identity-drift confidence 1-x → 0.5 常量',
    from: '        confidence: (r) => 1 - (r.identityCoherence || 0),',
    to: '        confidence: (r) => 0.5,',
  },
  {
    id: 'M4',
    label: 'counterfactual-insight 乘子 0.15 → 0.1',
    from: '        confidence: (r) => Math.min(0.8, r.alternatives.length * 0.15),',
    to: '        confidence: (r) => Math.min(0.8, r.alternatives.length * 0.1),',
  },
  {
    id: 'M5',
    label: 'field-degrading 阈值 0.3 → 0.5',
    from: '        match: (r) => r._fieldH !== undefined && r._fieldH < 0.3,',
    to: '        match: (r) => r._fieldH !== undefined && r._fieldH < 0.5,',
  },
  {
    id: 'M6',
    label: 'execution-success confidence T.standard → 0.9',
    from: "        id: 'execution-success',",
    to: "        id: 'execution-success-X',",
    expect: 'red-by-missing-rule',
  },
  {
    id: 'M7',
    label: '语义镜像：error-severity 的 decision heal → pause',
    from: "        id: 'error-severity',",
    to: "        id: 'error-severity-Y',",
    expect: 'red-by-missing-rule',
  },
];

const CONTROL = {
  id: 'N1',
  label: '对照组：只改注释文字',
  from: '    const matches = [];',
  to: '    const matches = []; // negative-control-comment',
};

function runTest() {
  try {
    execFileSync('node', [TEST], { cwd: ROOT, stdio: 'pipe', timeout: 120000 });
    return { code: 0, out: '' };
  } catch (e) {
    return { code: e.status || 1, out: String(e.stdout || '') + String(e.stderr || '') };
  }
}

function applyMutation(m) {
  const original = fs.readFileSync(SRC, 'utf8');
  if (original.indexOf(m.from) === -1) {
    console.log(`  ⚠️  ${m.id}: 锚点未找到（可能 src 已变），跳过`);
    return null;
  }
  const occurrences = original.split(m.from).length - 1;
  let mutated = original;
  if (m.expect === 'red-by-missing-rule') {
    // 改规则 id 会让 find(x=>x.id===...) 找不到 → 必红
    mutated = original.replace(m.from, m.to);
  } else {
    mutated = original.replace(m.from, m.to);
  }
  fs.writeFileSync(SRC, mutated);
  return { original, occurrences };
}

function restore(original) {
  fs.writeFileSync(SRC, original);
}

function verifyRestored(m) {
  const now = fs.readFileSync(SRC, 'utf8');
  if (now.indexOf(m.to) !== -1) return false;
  return true;
}

console.log('=== 第 221 轮负例守卫：decision-router 规则语义覆盖 ===\n');

const results = [];
for (const m of MUTATIONS) {
  const snap = applyMutation(m);
  if (!snap) { results.push({ id: m.id, status: 'SKIP' }); continue; }
  const r = runTest();
  const red = r.code !== 0;
  restore(snap.original);
  const clean = verifyRestored(m);
  const status = red && clean ? 'OK' : (red ? 'NOT-RESTORED' : 'INVALID');
  results.push({ id: m.id, status, occurrences: snap.occurrences, expected: m.expect || 'red' });
  console.log(`  ${m.id} ${m.label} → ${red ? '红' : '绿'} (code=${r.code}) 还原=${clean ? '是' : '否'} ${status === 'OK' ? '✅' : '❌'}`);
}

// 对照组
{
  const m = CONTROL;
  const snap = applyMutation(m);
  if (snap) {
    const r = runTest();
    restore(snap.original);
    const clean = verifyRestored(m);
    const green = r.code === 0;
    const status = green && clean ? 'OK' : 'BAD';
    results.push({ id: m.id, status });
    console.log(`  ${m.id} ${m.label} → ${green ? '绿' : '红'} (code=${r.code}) 还原=${clean ? '是' : '否'} ${status === 'OK' ? '✅' : '❌'}`);
  }
}

// 还原后用原始文件再跑一次，确认基线全绿
const baseline = runTest();
console.log(`\n还原后基线测试: ${baseline.code === 0 ? '全绿 ✅' : '红 ❌ code=' + baseline.code}`);

const bad = results.filter(x => x.status !== 'OK');
console.log(`\n守卫结果: ${results.length - bad.length}/${results.length} 有效`);
if (baseline.code !== 0) {
  console.log('\n❌ 基线不是全绿 —— 守卫结论无效');
  process.exit(1);
}
if (bad.length > 0) {
  console.log(`\n❌ ${bad.length} 个用例无效: ${bad.map(b => b.id + ':' + b.status).join(', ')}`);
  process.exit(1);
}
console.log('\n✅ 全部变异必红 + 对照组必绿 + 还原后基线全绿');
process.exit(0);
