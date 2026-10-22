// 第 220 轮探针：摸清 decision-router 规则匹配的可断言形状
// 目的：把 test/decision-router.test.js 的「崩溃当预期」假绿测试换成真断言，
// 先实测规则集规模、哪些 result 形状能命中哪些 decision.type。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { DecisionRouter } = require(path.join(ROOT, 'src/core/decision-router.js'));

const dr = new DecisionRouter({}, { modelProfile: 'flash' });

console.log('PROBE-RULES-COUNT:', JSON.stringify({
  rulesLength: dr._rules ? dr._rules.length : null,
  first3: (dr._rules || []).slice(0, 3).map(r => ({ id: r.id, decision: r.decision, domain: r.domain || null, weight: r.weight })),
  decisionTypes: [...new Set((dr._rules || []).map(r => r.decision))],
}));

// 构造一组典型 result，看命中情况
const samples = [
  { name: 'empty', result: {} },
  { name: 'null', result: null },
  { name: 'risk-high', result: { riskLevel: 'high', score: 0.9 } },
  { name: 'error', result: { errors: ['boom'], success: false } },
  { name: 'slow', result: { latencyMs: 60000, slow: true } },
  { name: 'noData', result: { dataPoints: 0, insufficient: true } },
];

for (const s of samples) {
  try {
    const r = dr.evaluate(s.result, 'probe', s.name);
    console.log('PROBE-EVAL:', JSON.stringify({
      name: s.name,
      matched: r.matched,
      decisionType: r.decision ? r.decision.type : null,
      confidence: r.decision ? r.decision.confidence : null,
      ruleId: r.decision ? r.decision.ruleId : null,
      rulesLen: r.rules ? r.rules.length : null,
      hasField: !!r.field,
      hasDomain: !!r.domain,
    }));
  } catch (e) {
    console.log('PROBE-EVAL-THROW:', JSON.stringify({ name: s.name, err: e.message }));
  }
}

// getStats / getRules 形状
console.log('PROBE-STATS:', JSON.stringify({
  statsKeys: dr.getStats() ? Object.keys(dr.getStats()) : null,
  totalEvaluations: dr.getStats() ? dr.getStats().totalEvaluations : null,
  rulesCount: dr.getStats() ? dr.getStats().rulesCount : null,
  rulesFromGetRules: dr.getRules() ? dr.getRules().length : null,
}));

// 抑制窗口：同一规则短时间内二次命中应被抑制
try {
  const a = dr.evaluate({ riskLevel: 'high', score: 0.95 }, 'probe', 'sup-1');
  const b = dr.evaluate({ riskLevel: 'high', score: 0.95 }, 'probe', 'sup-2');
  console.log('PROBE-SUPPRESS:', JSON.stringify({
    a: { matched: a.matched, type: a.decision && a.decision.type },
    b: { matched: b.matched, type: b.decision && b.decision.type, ruleId: b.decision && b.decision.ruleId },
    suppressedCount: dr.getStats() ? dr.getStats().suppressedCount : null,
  }));
} catch (e) {
  console.log('PROBE-SUPPRESS-THROW:', e.message);
}
