// 第 221 轮探针 G：CED/domain 联动仲裁语义（探针 F 的延续）。
//
// 实测发现（本轮最重要的结构性事实）：
//   evaluate() 的规则不是 34 条全量参与仲裁。`_ced.filterRules` 按 input
//   复杂度裁人，默认跑一次简单输入只剩 18 条参与 ——
//   goal-invalid / goal-unethical / execution-failure / security-breach /
//   field-* 等 16 条规则**不在参与集里**，所以它们的 match/confidence
//   从来没被执行过（真死规则，不是「被抢先」）。
//   唯一例外：传 domainHint 时 `domainCtx.primary = hint`，CED 才会放行
//   对应 domain 的规则。
//
// 因此断言这些规则必须：① 传 domainHint（safety/ethics/cognition），
// ② 或关 CED。本探针把两条路都测出来，供测试文件选稳定的那条。
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

function run(input, source, text, hint, opts) {
  const d = new DecisionRouter(opts || {}, { modelProfile: 'flash', cedEnabled: opts && opts.cedEnabled === false ? false : true });
  const res = d.evaluate(input, source, text, hint);
  return {
    type: res.decision.type,
    conf: Math.round(res.decision.confidence * 1000) / 1000,
    ruleId: res.decision.ruleId,
    all: res.rules.map(x => x.ruleId),
    active: d._activeRulesForEval.length,
  };
}

const LONG = '关于目标有效性与伦理风险的推理输入 '.repeat(20);

console.log('=== 路径 A：domainHint=safety / ethics / cognition ===');
for (const hint of ['safety', 'ethics', 'cognition', 'behavior']) {
  const r = run({ quality: 0.9, goalValid: false, goalEthical: false, securityBreach: true, dataLaborExploitation: true, buildPhilosophyViolation: true, smartHomeDependency: true }, 'probe', LONG, hint);
  console.log(hint.padEnd(11), r.ruleId.padEnd(24), String(r.conf).padEnd(5), 'active=' + String(r.active).padEnd(3), '[' + r.all.join(',') + ']');
}

console.log('\n=== 路径 B：关闭 CED（34 条全量仲裁）===');
const rB = run({ quality: 0.9, goalValid: false }, 'probe', LONG, null, { cedEnabled: false });
console.log('goal-invalid', rB.ruleId.padEnd(24), rB.type, rB.conf, 'active=' + rB.active, '[' + rB.all.join(',') + ']');

console.log('\n=== 每条规则在「关 CED」下的仲裁语义（全量） ===');
const d0 = new DecisionRouter({}, { modelProfile: 'flash' });
const ids = d0._rules.map(x => x.id);
const INPUTS = {
  'cognitive-overload': { cognitiveLoad: 0.8 },
  'cognitive-clarity': { cognitiveLoad: 0.1, directionClear: 0.8 },
  'cognitive-dissonance': { dissonance: 0.8 },
  'decision-degrading': { quality: 0.3 },
  'identity-drift': { identityCoherence: 0.2, quality: 0.9 },
  'error-severity': { severity: 'CRITICAL', quality: 0.9 },
  'error-transient': { severity: 'TRANSIENT', quality: 0.9 },
  'challenge-received': { challenge: true, quality: 0.9 },
  'cost-aware': { estimatedCost: 0.2, quality: 0.9 },
  'value-resonance': { valueResonance: 0.8, quality: 0.9 },
  'knowledge-transmissible': { quality: 0.8, confidence: 0.7 },
  'counterfactual-insight': { alternatives: [{}, {}, {}], quality: 0.9 },
  'meta-insight': { awareness: 0.8, quality: 0.9 },
  'belief-stable': { ok: true, confidence: 0.8, quality: 0.9 },
  'belief-broken': { ok: false, quality: 0.9 },
  'commonsense-failure': { valid: false, quality: 0.9 },
  'instability': { stability: 0.1, quality: 0.9 },
  'execution-success': { success: true, quality: 0.9 },
  'execution-failure': { success: false, quality: 0.9 },
  'goal-invalid': { goalValid: false, quality: 0.9 },
  'goal-unethical': { goalEthical: false, quality: 0.9 },
  'goal-needs-post-resolution': { postResolution: 'pending', quality: 0.9 },
  'field-degrading': {},
  'field-reversal': { _fieldFlipAlert: 'primary', quality: 0.9 },
  'field-peak-reversal': { _fieldPeakReversal: true, quality: 0.9 },
  'field-stable': { _fieldH: 0.6, _fieldA: 0.2, _fieldU: 0.4 },
  'field-resonance': { _fieldResonance: true, _fieldResonanceSteps: 4, _fieldH: 0.6 },
  'field-resonance-decay': { _fieldResonance: false, quality: 0.9 },
  'prevent-overthinking': { thoughtChain: [1, 2, 3, 4, 5, 6], confidence: 0.3, quality: 0.9 },
  'agi-policy-shift': { agiPolicyRisk: true, quality: 0.9 },
  'security-breach': { securityBreach: true, quality: 0.9 },
  'smart-home-dependency': { smartHomeDependency: true, quality: 0.9 },
  'data-labor-exploitation': { dataLaborExploitation: true, quality: 0.9 },
  'build-philosophy-violation': { buildPhilosophyViolation: true, quality: 0.9 },
};
let best = 0, listed = 0, none = 0;
for (const id of ids) {
  const r = run(INPUTS[id] || {}, 'probe', '', null, { cedEnabled: false });
  const isBest = r.ruleId === id;
  const inList = r.all.includes(id);
  if (isBest) best++;
  else if (inList) listed++;
  else none++;
  console.log(
    (isBest ? 'BEST' : (inList ? 'LIST' : '----')).padEnd(5),
    id.padEnd(28),
    r.type.padEnd(11),
    String(r.conf).padEnd(5),
    r.ruleId.padEnd(24),
    '[' + r.all.join(',') + ']'
  );
}
console.log(`\n关 CED 下：best=${best} listed-only=${listed} never=${none} / total=${ids.length}`);
