// 第 221 轮探针 D：**单规则语义指纹** —— 不经过 evaluate 的优先级仲裁，
// 直接对每条规则用自己的输入调 match()/confidence()/rationale()，
// 拿确定性三元组（是否命中 / 置信度档位 / 决策类型）。
//
// 为什么要绕开 evaluate：evaluate 会先 `_updateFieldTracking` 注入 _fieldH，
// 空输入恒算出 H=0.21 < 0.3 → field-degrading 恒命中（heal 优先级 100），
// 把一大批规则从「自身命中」压成「被抢先」。这是真实仲裁语义，
// 但断言单条规则必须绕过它，否则写出来的全是 field-degrading 的重复断言。
//
// 使用方式：node scripts/round-221/probe-r221-fingerprint.js
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

const d0 = new DecisionRouter({}, { modelProfile: 'flash' });
const T = d0._thresholds;
const rules = d0._rules;

// 每条规则的针对性输入（按 match() 读的真实信号名）
const INPUTS = {
  'cognitive-overload': { cognitiveLoad: 0.8 },
  'cognitive-clarity': { cognitiveLoad: 0.1, directionClear: 0.8 },
  'cognitive-dissonance': { dissonance: 0.8 },
  'decision-degrading': { quality: 0.3 },
  'identity-drift': { identityCoherence: 0.2 },
  'error-severity': { severity: 'CRITICAL' },
  'error-transient': { severity: 'TRANSIENT' },
  'challenge-received': { challenge: true },
  'cost-aware': { estimatedCost: 0.2 },
  'value-resonance': { valueResonance: 0.8 },
  'knowledge-transmissible': { quality: 0.8, confidence: 0.7 },
  'counterfactual-insight': { alternatives: [{}, {}, {}] },
  'meta-insight': { awareness: 0.8 },
  'belief-stable': { ok: true, confidence: 0.8 },
  'belief-broken': { ok: false },
  'commonsense-failure': { valid: false },
  'instability': { stability: 0.1 },
  'execution-success': { success: true },
  'execution-failure': { success: false },
  'goal-invalid': { goalValid: false },
  'goal-unethical': { goalEthical: false },
  'goal-needs-post-resolution': { postResolution: 'pending' },
  'field-degrading': { _fieldH: 0.1 },
  'field-reversal': { _fieldFlipAlert: 'primary' },
  'field-peak-reversal': { _fieldPeakReversal: true },
  'field-stable': { _fieldH: 0.6, _fieldA: 0.2, _fieldU: 0.4 },
  'field-resonance': { _fieldResonance: true, _fieldResonanceSteps: 4, _fieldH: 0.6 },
  'field-resonance-decay': { _fieldResonance: false },
  'prevent-overthinking': { thoughtChain: [1, 2, 3, 4, 5, 6], confidence: 0.3 },
  'agi-policy-shift': { agiPolicyRisk: true },
  'security-breach': { securityBreach: true },
  'smart-home-dependency': { smartHomeDependency: true },
  'data-labor-exploitation': { dataLaborExploitation: true },
  'build-philosophy-violation': { buildPhilosophyViolation: true },
};

console.log('thresholds:', JSON.stringify(T));
console.log('');
for (const r of rules) {
  const input = INPUTS[r.id];
  let m = null, c = null, ra = null, err = null;
  try {
    m = r.match(input);
    c = r.confidence(input);
    ra = r.rationale(input);
  } catch (e) { err = e.message; }
  const cs = typeof c === 'number' ? (Math.round(c * 1000) / 1000) : String(c);
  console.log(
    r.id.padEnd(28),
    r.decision.padEnd(11),
    'match=' + String(m).padEnd(6),
    'conf=' + String(cs).padEnd(7),
    'rat=' + (err ? 'ERR' + err.slice(0, 30) : (typeof ra === 'string' && ra.length > 0 ? 'nonempty' : 'EMPTY'))
  );
}

// field-resonance-decay 依赖 this._resonanceState.lastExitReason，单独补测
console.log('\n--- field-resonance-decay 依赖实例状态 ---');
(() => {
  const d = new DecisionRouter({}, { modelProfile: 'flash' });
  d._resonanceState.lastExitReason = 'A_exceeded';
  const r = d._rules.find(x => x.id === 'field-resonance-decay');
  console.log('lastExitReason=A_exceeded → match=', r.match({ _fieldResonance: false }), 'conf=', r.confidence({ _fieldResonance: false }));
  const d2 = new DecisionRouter({}, { modelProfile: 'flash' });
  const r2 = d2._rules.find(x => x.id === 'field-resonance-decay');
  console.log('lastExitReason=null     → match=', r2.match({ _fieldResonance: false }), 'conf=', r2.confidence({ _fieldResonance: false }));
})();
