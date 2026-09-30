#!/usr/bin/env node
/** 第 219 轮 report 段探针：selfVerification 三态边界 */
const path = require('path');
const { ReportGenerator } = require(path.join(__dirname, '..', '..', 'src', 'report', 'report-generator.js'));

const rg = new ReportGenerator();

const r1 = rg.generate({
  output: { conclusion: '方案可行，因为前两步已验证通过' },
  chain: { stages: [{ name: 'SYNTHESIS', result: { reasoningChain: '因为前两步已验证通过，所以方案可行' } }] },
  _selfVerification: {
    passed: false,
    checks: { reverseConsistency: true, logicalChain: false, counterfactual: false, coverageCheck: true },
    issues: ['可能存在隐藏假设', '未考虑替代推理路径'],
    confidence: 0.75,
  },
  _selfVerificationIssues: ['可能存在隐藏假设'],
  _reflectionLoopClosed: { health: 'healthy' },
});
console.log('real-issue:', JSON.stringify(r1.report.selfVerification));

const r2 = rg.generate({
  output: { conclusion: 'x' },
  _selfVerification: { passed: false, issues: ['未考虑替代推理路径'], confidence: 0.75 },
  _selfVerificationIssues: [],
});
console.log('noise-only:', JSON.stringify(r2.report.selfVerification));

const r3 = rg.generate({ output: { conclusion: 'x' } });
console.log('absent:', JSON.stringify(r3.report.selfVerification));

const r4 = rg.generate({ output: { conclusion: 'x' }, _reflectionLoopClosed: { health: 'degraded' } });
console.log('rl-only:', JSON.stringify(r4.report.selfVerification));
