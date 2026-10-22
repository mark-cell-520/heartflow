// 第 221 轮探针 B：补 A 未命中规则的针对性输入（按真实 match() 信号名），
// 并对多命中场景取 top1 语义。每规则独立实例（抑制窗口纪律）。
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

const CASES = {
  'identity-drift': () => ({ identityCoherence: 0.2 }),
  'error-severity': () => ({ severity: 'CRITICAL' }),
  'error-transient': () => ({ severity: 'TRANSIENT' }),
  'challenge-received': () => ({ challenge: true }),
  'cost-aware': () => ({ estimatedCost: 0.2 }),
  'value-resonance': () => ({ valueResonance: 0.8 }),
  'knowledge-transmissible': () => ({ quality: 0.8, confidence: 0.7 }),
  'counterfactual-insight': () => ({ alternatives: [{ x: 1 }, { x: 2 }, { x: 3 }] }),
  'meta-insight': () => ({ awareness: 0.8 }),
  'belief-stable': () => ({ ok: true, confidence: 0.8 }),
  'belief-broken': () => ({ ok: false }),
  'goal-invalid': () => ({ goalValid: false }),
  'goal-unethical': () => ({ goalEthical: false }),
  'goal-needs-post-resolution': () => ({ postResolution: 'pending' }),
  'field-degrading': () => ({ _fieldFlipAlert: 'A_high' }),
  'field-reversal': () => ({ _fieldFlipAlert: 'primary' }),
  'field-peak-reversal': () => ({ _fieldPeakReversal: true }),
  'field-stable': () => ({ _fieldH: 0.6, _fieldA: 0.2, _fieldU: 0.4 }),
  'field-resonance': () => ({ _fieldResonance: true, _fieldResonanceSteps: 4, _fieldH: 0.6 }),
  'prevent-overthinking': () => ({ thoughtChain: [1, 2, 3, 4, 5, 6], confidence: 0.3 }),
  'agi-policy-shift': () => ({ agiPolicyRisk: true }),
  'security-breach': () => ({ securityBreach: true }),
  'smart-home-dependency': () => ({ smartHomeDependency: true }),
  'data-labor-exploitation': () => ({ dataLaborExploitation: true }),
  'build-philosophy-violation': () => ({ buildPhilosophyViolation: true }),
  'commonsense-failure': () => ({ valid: false }),
  'instability': () => ({ stability: 0.1 }),
  'execution-success': () => ({ success: true }),
  'execution-failure': () => ({ success: false }),
};

const dr0 = new DecisionRouter({}, { modelProfile: 'flash' });
const ids = dr0._rules.map(r => r.id);
const out = [];
for (const id of ids) {
  const mk = CASES[id];
  let res = null, err = null;
  try {
    const d = new DecisionRouter({}, { modelProfile: 'flash' });
    res = d.evaluate(mk ? mk() : {}, 'probe', 'p-' + id);
  } catch (e) { err = e.message; }
  out.push({
    id,
    err,
    matched: res && res.matched,
    type: res && res.decision && res.decision.type,
    conf: res && res.decision && Math.round((res.decision.confidence || 0) * 1000) / 1000,
    ruleId: res && res.decision && res.decision.ruleId,
    rules: res ? res.rules.map(x => x.ruleId) : null,
  });
}
console.log(JSON.stringify(out));
