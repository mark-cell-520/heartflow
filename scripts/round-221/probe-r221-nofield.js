// 第 221 轮探针 F：关掉 _updateFieldTracking 后看真实仲裁。
// 目的：定位「哪些规则在真实 evaluate 里永远当不上 best」。
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

function probe(id, input, killFieldTracking) {
  const d = new DecisionRouter({}, { modelProfile: 'flash' });
  if (killFieldTracking) d._updateFieldTracking = () => ({});
  const res = d.evaluate(input, 'p', 'x-' + id);
  return {
    type: res.decision.type,
    conf: Math.round(res.decision.confidence * 1000) / 1000,
    ruleId: res.decision.ruleId,
    all: res.rules.map(x => x.ruleId),
  };
}

const CASES = [
  ['execution-failure', { quality: 0.9, success: false }],
  ['goal-invalid', { quality: 0.9, goalValid: false }],
  ['goal-unethical', { quality: 0.9, goalEthical: false }],
  ['goal-needs-post-resolution', { quality: 0.9, postResolution: 'pending' }],
  ['prevent-overthinking', { quality: 0.9, thoughtChain: [1, 2, 3, 4, 5, 6], confidence: 0.3 }],
  ['field-reversal', { quality: 0.9, _fieldFlipAlert: 'primary' }],
  ['field-peak-reversal', { quality: 0.9, _fieldPeakReversal: true }],
  ['field-stable', { quality: 0.4, identityCoherence: 0.5, _fieldA: 0.2, _fieldU: 0.6, _fieldH: 0.6 }],
  ['field-resonance', { quality: 0.9, _fieldResonance: true, _fieldResonanceSteps: 4, _fieldH: 0.6 }],
  ['security-breach', { quality: 0.9, securityBreach: true }],
  ['data-labor-exploitation', { quality: 0.9, dataLaborExploitation: true }],
  ['agi-policy-shift', { quality: 0.9, agiPolicyRisk: true }],
  ['smart-home-dependency', { quality: 0.9, smartHomeDependency: true }],
  ['build-philosophy-violation', { quality: 0.9, buildPhilosophyViolation: true }],
  ['field-resonance-decay', { quality: 0.9, _fieldResonance: false }],
];

console.log('id                          withFieldTracking                    | fieldTrackingDisabled');
for (const [id, input] of CASES) {
  const a = probe(id, input, false);
  const b = probe(id, input, true);
  console.log(
    id.padEnd(26),
    (a.ruleId + '/' + a.type + '/' + a.conf).padEnd(36),
    '|',
    (b.ruleId + '/' + b.type + '/' + b.conf).padEnd(22),
    '[' + b.all.join(',') + ']'
  );
}
