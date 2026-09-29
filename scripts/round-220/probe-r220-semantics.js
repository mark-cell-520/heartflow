// 第 220 轮探针 2：摸清 flash profile 阈值与规则语义，供写真断言用
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { DecisionRouter } = require(path.join(ROOT, 'src/core/decision-router.js'));

const dr = new DecisionRouter({}, { modelProfile: 'flash' });
const T = dr._thresholds;
console.log('PROBE-THRESHOLDS:', JSON.stringify(T));

// 单规则语义：逐个造只有该规则能命中的输入
const cases = [
  { id: 'cognitive-overload', input: { cognitiveLoad: T.high + 0.1 } },
  { id: 'cognitive-overload-mid', input: { cognitiveLoad: (T.high + T.standard) / 2 } },
  { id: 'cognitive-overload-low', input: { cognitiveLoad: 0.01 } },
  { id: 'cognitive-clarity', input: { cognitiveLoad: T.floor - 0.1, directionClear: T.high + 0.1 } },
  { id: 'cognitive-dissonance', input: { dissonance: T.high + 0.1 } },
  { id: 'decision-degrading', input: { quality: T.fallback - 0.1 } },
];
for (const c of cases) {
  try {
    const r = dr.evaluate(c.input, 'probe', c.id);
    console.log('PROBE-CASE:', JSON.stringify({
      id: c.id, matched: r.matched, type: r.decision && r.decision.type,
      conf: r.decision && r.decision.confidence, ruleId: r.decision && r.decision.ruleId,
      rules: r.rules.map(x => x.ruleId),
    }));
  } catch (e) { console.log('PROBE-CASE-THROW:', c.id, e.message); }
}

// 抑制窗口隔离实验：新实例 + 同一输入两次
const dr2 = new DecisionRouter({}, { modelProfile: 'flash' });
const a = dr2.evaluate({ cognitiveLoad: dr2._thresholds.high + 0.1 }, 'probe', 'supA');
const b = dr2.evaluate({ cognitiveLoad: dr2._thresholds.high + 0.1 }, 'probe', 'supB');
console.log('PROBE-SUP-ISOLATED:', JSON.stringify({
  a: { matched: a.matched, type: a.decision.type, ruleId: a.decision.ruleId },
  b: { matched: b.matched, type: b.decision.type, ruleId: b.decision.ruleId },
  suppressedCount: dr2.getStats().suppressedCount,
  suppressionSize: dr2._suppression.size,
}));

// 非对象输入早退契约
for (const bad of [null, undefined, 42, 'str', true]) {
  const r = dr2.evaluate(bad, 'probe', 'bad');
  console.log('PROBE-EARLY:', JSON.stringify({ bad: String(bad), decision: r.decision, matched: r.matched, rules: r.rules }));
}

// 规则自身完整性
const bad = (dr.getRules() || []).filter(r => !r.id || !r.decision || typeof r.match !== 'function');
console.log('PROBE-RULE-SHAPE:', JSON.stringify({
  total: dr.getRules().length,
  noMatchFn: bad.length,
  keys: Object.keys(dr.getRules()[0] || {}),
  types: [...new Set(dr.getRules().map(r => r.decision))],
}));

// 恶意规则（match 抛错）不应炸掉 evaluate
const dr3 = new DecisionRouter({}, { modelProfile: 'flash' });
dr3._rules.push({ id: 'evil-throw', decision: 'heal', match: () => { throw new Error('x'); }, confidence: () => 0.9, rationale: () => 'x', fallback: null });
try {
  const r = dr3.evaluate({ cognitiveLoad: dr3._thresholds.high + 0.1 }, 'probe', 'evil');
  console.log('PROBE-EVIL-OK:', JSON.stringify({ matched: r.matched, rules: r.rules.map(x => x.ruleId) }));
} catch (e) { console.log('PROBE-EVIL-THROW:', e.message); }

// stats 递增契约
const dr4 = new DecisionRouter({}, { modelProfile: 'flash' });
const s0 = dr4.getStats();
dr4.evaluate({ cognitiveLoad: 0.5 }, 'probe', 'stat');
const s1 = dr4.getStats();
console.log('PROBE-STATS-INC:', JSON.stringify({ before: s0.totalEvaluations, after: s1.totalEvaluations, rulesCount: s1.rulesCount }));
