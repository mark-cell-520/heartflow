// 第 222 轮探针 1：_selfVerification 四个 check 的真实失败分布（不信 219 轮旧描述）
// 只打数字与形状，不打印样本原文（451 纪律）。
const { SelfVerifier } = require('../../src/identity/self-verifier.js');
const path = require('path');

const cases = [
  // [形状] C1: 有蕴含词 + 结论词出现在推理中 + 有条件词 + 有因素词 → 四 check 全过
  { id: 'C1', reasoning: '因为 A 导致 B，所以 C 是合理的；如果 D 变化则结果可能不同', conclusion: '因此 C 是合理的' },
  // [形状] C2: 有蕴含词但结论关键词不在推理中 → reverseConsistency 失败
  { id: 'C2', reasoning: '因为外部条件发生变化，所以我们重新评估整个方案', conclusion: '预算需要削减三分之一' },
  // [形状] C3: 含假设词但无连接词 → logicalChain 失败
  { id: 'C3', reasoning: '假设用户已经同意这个方案，接下来直接执行部署', conclusion: '直接部署上线' },
  // [形状] C4: 无条件词/限定词/替代词 → counterfactual 失败（已知恒定）
  { id: 'C4', reasoning: '数据表明转化率提升了，说明新策略有效', conclusion: '新策略有效' },
  // [形状] C5: 推理极短且无因素词 → coverageCheck 失败
  { id: 'C5', reasoning: 'A', conclusion: 'B' },
  // [形状] C6: reverseConsistency + counterfactual 双失败
  { id: 'C6', reasoning: '所有指标都在上升', conclusion: '收入翻倍了' },
  // [形状] C7: logicalChain + counterfactual + coverage 三失败
  { id: 'C7', reasoning: '就这样', conclusion: '不行' },
];

const sv = new SelfVerifier('/tmp/hf-r222-sv');
const dist = {};
const rows = [];
for (const c of cases) {
  const r = sv.verify(c.reasoning, c.conclusion);
  const failed = [];
  for (const [k, v] of Object.entries(r.checks)) if (!v) failed.push(k);
  rows.push({ id: c.id, passed: r.passed, confidence: r.confidence, authenticity: r.authenticity, failedChecks: failed, issueCount: r.issues.length });
  for (const f of failed) dist[f] = (dist[f] || 0) + 1;
}
console.log('==== R222-P1 分布（7 构造样本）====');
for (const r of rows) console.log(`${r.id} passed=${r.passed} conf=${r.confidence} auth=${r.authenticity} failed=[${r.failedChecks.join(',')}] issues=${r.issueCount}`);
console.log('---- 检查失败计数 ----');
console.log(JSON.stringify(dist));
const stats = sv.getStats();
console.log('---- getStats ----');
console.log(JSON.stringify({ totalVerified: stats.totalVerified, passes: stats.passes, fails: stats.fails, passRate: stats.passRate, recentIssueCount: stats.recentIssueCount }));
console.log('==== END ====');
