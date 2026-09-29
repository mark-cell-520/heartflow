// 第 221 轮探针 A：对 34 条 decision-router 规则逐条独立实例探针，
// 拿到确定性命中语义（matched / type / confidence / ruleId），
// 供本轮扩断言用。每规则一实例，规避抑制窗口污染（220 轮教训 1）。
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

// 每条规则造一组针对性输入；未列出的规则用空输入 + 信号拉满两种
const CASES = {
  'cognitive-overload': () => ({ cognitiveLoad: 0.8 }),
  'cognitive-clarity': () => ({ cognitiveLoad: 0.1, directionClear: 0.8 }),
  'cognitive-dissonance': () => ({ dissonance: 0.8 }),
  'decision-degrading': () => ({ quality: 0.3 }),
  'identity-drift': () => ({ identityDrift: 0.8 }),
  'error-severity': () => ({ errorSeverity: 0.8 }),
  'error-transient': () => ({ errorTransient: 0.8 }),
  'challenge-received': () => ({ challenge: 0.8 }),
  'cost-aware': () => ({ costPressure: 0.8 }),
  'value-resonance': () => ({ valueResonance: 0.8 }),
  'knowledge-transmissible': () => ({ knowledgeTransmissible: 0.8 }),
  'counterfactual-insight': () => ({ counterfactualInsight: 0.8 }),
  'meta-insight': () => ({ metaInsight: 0.8 }),
  'belief-stable': () => ({ beliefStable: 0.8 }),
  'belief-broken': () => ({ beliefBroken: 0.8 }),
  'commonsense-failure': () => ({ commonsenseFailure: 0.8 }),
  'instability': () => ({ instability: 0.8 }),
  'execution-success': () => ({ executionSuccess: 0.8 }),
  'execution-failure': () => ({ executionFailure: 0.8 }),
  'goal-invalid': () => ({ goalInvalid: 0.8 }),
  'goal-unethical': () => ({ goalUnethical: 0.8 }),
  'goal-needs-post-resolution': () => ({ goalNeedsPostResolution: 0.8 }),
  'field-degrading': () => ({ fieldDegrading: 0.8 }),
  'field-reversal': () => ({ fieldReversal: 0.8 }),
  'field-peak-reversal': () => ({ fieldPeakReversal: 0.8 }),
  'field-stable': () => ({ fieldStable: 0.8 }),
  'field-resonance': () => ({ fieldResonance: 0.8 }),
  'field-resonance-decay': () => ({ fieldResonanceDecay: 0.8 }),
  'prevent-overthinking': () => ({ overthinking: 0.8 }),
  'agi-policy-shift': () => ({ agiPolicyShift: 0.8 }),
  'security-breach': () => ({ securityBreach: 0.8 }),
  'smart-home-dependency': () => ({ smartHomeDependency: 0.8 }),
  'data-labor-exploitation': () => ({ dataLaborExploitation: 0.8 }),
  'build-philosophy-violation': () => ({ buildPhilosophyViolation: 0.8 }),
};

const dr0 = new DecisionRouter({}, { modelProfile: 'flash' });
const ids = dr0._rules.map(r => r.id);
const out = [];
for (const id of ids) {
  const mk = CASES[id];
  let res = null, err = null;
  try {
    const d = new DecisionRouter({}, { modelProfile: 'flash' });
    const input = mk ? mk() : {};
    res = d.evaluate(input, 'probe', 'p-' + id);
  } catch (e) { err = e.message; }
  out.push({
    id,
    err,
    matched: res && res.matched,
    type: res && res.decision && res.decision.type,
    conf: res && res.decision && res.decision.confidence,
    ruleId: res && res.decision && res.decision.ruleId,
    nRules: res ? res.rules.length : -1,
    rules: res ? res.rules.map(x => x.ruleId) : null,
  });
}
console.log(JSON.stringify(out, null, 1));
