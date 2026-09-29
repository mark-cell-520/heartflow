// 第 220 轮探针 3：修正探针 2 的抑制窗口污染 bug —— 每个 case 用独立实例
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { DecisionRouter } = require(path.join(ROOT, 'src/core/decision-router.js'));

const T = { floor: 0.3, standard: 0.5, high: 0.7, fallback: 0.4 };
const cases = [
  ['cognitiveLoad=0.8 (>high)', { cognitiveLoad: 0.8 }],
  ['cognitiveLoad=0.6 (std~high)', { cognitiveLoad: 0.6 }],
  ['cognitiveLoad=0.01 (<std)', { cognitiveLoad: 0.01 }],
  ['cognitiveLoad=0.2 (<floor)', { cognitiveLoad: 0.2 }],
  ['clarity low-dir', { cognitiveLoad: 0.1, directionClear: 0.8 }],
  ['clarity dir-low', { cognitiveLoad: 0.1, directionClear: 0.2 }],
  ['dissonance=0.8', { dissonance: 0.8 }],
  ['dissonance=0.55', { dissonance: 0.55 }],
  ['quality=0.3', { quality: 0.3 }],
  ['quality=0.5', { quality: 0.5 }],
];
for (const [name, input] of cases) {
  const dr = new DecisionRouter({}, { modelProfile: 'flash' });   // 关键：独立实例
  const r = dr.evaluate(input, 'probe', name);
  console.log('PROBE-CLEAN:', JSON.stringify({
    name, matched: r.matched, type: r.decision && r.decision.type,
    conf: r.decision && r.decision.confidence, ruleId: r.decision && r.decision.ruleId,
    rules: r.rules.map(x => x.ruleId + '@' + x.confidence),
  }));
}
