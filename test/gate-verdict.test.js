// 单元测试：gate-verdict.js 聚合逻辑 + 报告层集成
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { buildGateVerdict, isAllowed } = require(path.join(HF, 'src/gate-verdict.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { const r = fn(); if (r === true) { pass++; console.log('  ✅ ' + name); }
    else { fail++; console.log('  ❌ ' + name + ' → ' + r); } }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → 异常: ' + e.message); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b) ? true : `期望 ${JSON.stringify(b)} 实得 ${JSON.stringify(a)}`;

console.log('\n[gate-verdict 聚合逻辑]');

t('空 result → pass', () => eq(buildGateVerdict({}).action, 'pass'));
t('null → pass', () => eq(buildGateVerdict(null).action, 'pass'));

t('_highRiskOutput=true → block', () => eq(buildGateVerdict({ _highRiskOutput: true }).action, 'block'));
t('_blockedByFirewall → block', () => eq(buildGateVerdict({ _blockedByFirewall: true }).action, 'block'));
t('block 优先于 rewrite', () => eq(buildGateVerdict({ _highRiskOutput: true, _selfContradictory: true }).action, 'block'));

t('_selfContradictory → rewrite', () => eq(buildGateVerdict({ _selfContradictory: true }).action, 'rewrite'));
t('_restrainedBy 非空数组 → rewrite', () => eq(buildGateVerdict({ _restrainedBy: ['a', 'b'] }).action, 'rewrite'));
t('_inputCheckIssues 空数组 → 不触发', () => eq(buildGateVerdict({ _inputCheckIssues: [] }).action, 'pass'));
t('rewrite 优先于 verify', () => eq(buildGateVerdict({ _selfContradictory: true, _verification: { score: 0.1, issues: [1] } }).action, 'rewrite'));

t('_verification score<0.5 → verify', () => eq(buildGateVerdict({ _verification: { score: 0.2, issues: [] } }).action, 'verify'));
t('_verification score>=0.5 且无 issues → pass', () => eq(buildGateVerdict({ _verification: { score: 0.8, issues: [] } }).action, 'pass'));
t('_verification score 高但有 issues → verify', () => eq(buildGateVerdict({ _verification: { score: 0.9, issues: [{ message: 'x' }] } }).action, 'verify'));
t('_outputChecklistIssues 非空 → verify', () => eq(buildGateVerdict({ _outputChecklistIssues: ['w'] }).action, 'verify'));
t('_inputCheck passed=false → verify', () => eq(buildGateVerdict({ _inputCheck: { passed: false, warnings: [] } }).action, 'verify'));
t('_inputCheck passed=true 空警告 → pass', () => eq(buildGateVerdict({ _inputCheck: { passed: true, warnings: [] } }).action, 'pass'));
t('_driftCorrected → verify', () => eq(buildGateVerdict({ _driftCorrected: true }).action, 'verify'));

t('verify 的 score 取最低', () => eq(buildGateVerdict({ _verification: { score: 0.3, issues: [] } }).score, 0.3));
t('block 带 reason', () => /高风险/.test(buildGateVerdict({ _highRiskOutput: true }).reason) === true);
t('signals 含标签', () => eq(buildGateVerdict({ _selfContradictory: true }).signals, ['自相矛盾']));
t('isAllowed(block)=false', () => eq(isAllowed(buildGateVerdict({ _highRiskOutput: true })), false));
t('isAllowed(pass)=true', () => eq(isAllowed(buildGateVerdict({})), true));
t('isAllowed(verify)=true（软放行）', () => eq(isAllowed(buildGateVerdict({ _driftCorrected: true })), true));

// 多信号合并
t('多 verify 信号全部列出', () => {
  const v = buildGateVerdict({ _driftCorrected: true, _epistemicSafety: { ok: false }, _moralFrames: ['a'] });
  return v.signals.length >= 2 ? true : `只列出 ${v.signals.length} 个`;
});

console.log('\n[报告层集成]');
const { ReportGenerator } = require(path.join(HF, 'src/report/report-generator.js'));
const gen = new ReportGenerator();

t('高风险 result → 报告 gate.action=block', () => {
  const r = gen.generate({ conclusion: '测试', confidence: 0.9, _highRiskOutput: true });
  return eq(r.report.gate.action, 'block');
});
t('自验证低分 → 报告 gate.action=verify', () => {
  const r = gen.generate({ conclusion: '测试', confidence: 0.9, _verification: { score: 0.1, issues: [{ message: '矛盾' }] } });
  return eq(r.report.gate.action, 'verify');
});
t('干净 result → 报告 gate.action=pass', () => {
  const r = gen.generate({ conclusion: '测试', confidence: 0.9 });
  return eq(r.report.gate.action, 'pass');
});
t('报告 gate 段不抛异常（gate-verdict 缺失时降级）', () => {
  const r = gen.generate({ conclusion: 'x' });
  return r.report && r.report.gate ? true : '缺 gate 段';
});

console.log(`\n结果: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
