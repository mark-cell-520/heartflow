// 第 221 轮探针 E：**evaluate 层仲裁语义**（不是单规则指纹）——
// 用 CED/domainClassifier 默认开启的真实 evaluate，找每条规则的
// 「确定性输入」：即该规则成为 best.ruleId（或至少出现在 rules[] 里）的输入。
//
// 为什么要这一层：220/221 轮实测教训是「单规则 match=true 不等于引擎选它」——
// evaluate 会注入 _fieldH（空输入 → H=0.21 <0.3 → field-degrading 恒命中，
// heal 优先级 100 抢先）。断言要写引擎真实行为，必须过这一层。
//
// 结果直接用于 test/decision-router.test.js 本轮扩展。
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

const d0 = new DecisionRouter({}, { modelProfile: 'flash' });
const T = d0._thresholds;
const rules = d0._rules;

// 候选手工输入（覆盖各规则 match 信号），由探针筛出真正有效的
const CANDIDATES = {
  'cognitive-overload': [{ cognitiveLoad: 0.8 }],
  'cognitive-clarity': [{ cognitiveLoad: 0.1, directionClear: 0.8 }],
  'cognitive-dissonance': [{ dissonance: 0.8 }],
  'decision-degrading': [{ quality: 0.3 }],
  'identity-drift': [{ identityCoherence: 0.2, quality: 0.9 }],
  'error-severity': [{ severity: 'CRITICAL', quality: 0.9 }],
  'error-transient': [{ severity: 'TRANSIENT', quality: 0.9 }],
  'challenge-received': [{ challenge: true, quality: 0.9 }],
  'cost-aware': [{ estimatedCost: 0.2, quality: 0.9 }],
  'value-resonance': [{ valueResonance: 0.8, quality: 0.9 }],
  'knowledge-transmissible': [{ quality: 0.8, confidence: 0.7, identityCoherence: 0.9 }],
  'counterfactual-insight': [{ alternatives: [{}, {}, {}], quality: 0.9, identityCoherence: 0.9 }],
  'meta-insight': [{ awareness: 0.8, quality: 0.9, identityCoherence: 0.9 }],
  'belief-stable': [{ ok: true, confidence: 0.8, quality: 0.9 }],
  'belief-broken': [{ ok: false, quality: 0.9 }],
  'commonsense-failure': [{ valid: false, quality: 0.9 }],
  'instability': [{ stability: 0.1, quality: 0.9 }],
  'execution-success': [{ success: true, quality: 0.9, identityCoherence: 0.9 }],
  'execution-failure': [{ success: false, quality: 0.9 }],
  'goal-invalid': [{ goalValid: false, quality: 0.9 }],
  'goal-unethical': [{ goalEthical: false, quality: 0.9 }],
  'goal-needs-post-resolution': [{ postResolution: 'pending', quality: 0.9 }],
  'field-degrading': [{ _fieldH: 0.1 }],
  'field-reversal': [{ _fieldFlipAlert: 'primary', quality: 0.9 }],
  'field-peak-reversal': [{ _fieldPeakReversal: true, quality: 0.9 }],
  'field-stable': [{ _fieldH: 0.6, _fieldA: 0.2, _fieldU: 0.4, _fieldD: 0.9 }],
  'field-resonance': [{ _fieldResonance: true, _fieldResonanceSteps: 4, _fieldH: 0.6 }],
  'field-resonance-decay': [{ _fieldResonance: false }],
  'prevent-overthinking': [{ thoughtChain: [1, 2, 3, 4, 5, 6], confidence: 0.3, quality: 0.9 }],
  'agi-policy-shift': [{ agiPolicyRisk: true, quality: 0.9 }],
  'security-breach': [{ securityBreach: true, quality: 0.9 }],
  'smart-home-dependency': [{ smartHomeDependency: true, quality: 0.9 }],
  'data-labor-exploitation': [{ dataLaborExploitation: true, quality: 0.9 }],
  'build-philosophy-violation': [{ buildPhilosophyViolation: true, quality: 0.9 }],
};

const out = {};
for (const r of rules) {
  const cands = CANDIDATES[r.id] || [{}];
  const results = [];
  for (const input of cands) {
    const d = new DecisionRouter({}, { modelProfile: 'flash' });
    const res = d.evaluate(input, 'p', 'arb-' + r.id);
    results.push({
      input,
      type: res.decision.type,
      conf: Math.round(res.decision.confidence * 1000) / 1000,
      ruleId: res.decision.ruleId,
      matched: res.matched,
      all: res.rules.map(x => x.ruleId),
    });
  }
  out[r.id] = results;
  const best = results.find(x => x.ruleId === r.id);
  const inList = results.some(x => x.all.includes(r.id));
  console.log(
    (best ? 'BEST' : (inList ? 'LIST' : '----')).padEnd(5),
    r.id.padEnd(28),
    r.decision.padEnd(11),
    '→ best=' + (results[0].ruleId).padEnd(24),
    'conf=' + String(results[0].conf).padEnd(6),
    'n=' + results[0].all.length
  );
}
require('fs').writeFileSync('/tmp/r221-arb.json', JSON.stringify(out, null, 1));
console.log('\nwritten /tmp/r221-arb.json');
