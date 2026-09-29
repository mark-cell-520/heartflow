// 第 221 轮探针 C：单规则隔离语义 —— 只对目标规则输入其专属信号，
// 并用 U/D/A 提取器反推，确保不误触发 field-degrading（_fieldH<0.3）。
//
// 关键实测发现（本轮）：`_updateFieldTracking` 在每次 evaluate 前都注入场域字段，
// 空输入会算出 H=0.21 → _fieldH=0.21 < 0.3 → **field-degrading 恒命中**，
// 于是一大批「看起来没命中」的规则（goal-invalid / goal-unethical /
// prevent-overthinking / field-stable / field-resonance ...）全被这条兜底规则
// 抢先（heal 优先级 100）。这是真实语义，不是 bug —— 但测试必须区分
// 「自身 match 为 true 但被别人抢先」与「自身 match 为 false」。
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

const d0 = new DecisionRouter({}, { modelProfile: 'flash' });
const rules = d0._rules;
const byId = {};
for (const r of rules) byId[r.id] = r;

function run(ruleId, input) {
  const d = new DecisionRouter({}, { modelProfile: 'flash' });
  d._domainClassifier = null;
  d._cedEnabled = false;
  const res = d.evaluate(input, 'p', 'iso-' + ruleId);
  const r = byId[ruleId];
  const selfMatch = r.match(input);
  const selfConf = r.confidence(input);
  return {
    id: ruleId,
    selfMatch,
    selfConf: Math.round(selfConf * 1000) / 1000,
    engineType: res.decision.type,
    engineConf: Math.round(res.decision.confidence * 1000) / 1000,
    engineRuleId: res.decision.ruleId,
    inList: res.rules.map(x => x.ruleId).includes(ruleId),
    all: res.rules.map(x => x.ruleId),
  };
}

// 每条的输入都同时满足「自身 match 条件」与「不让 field-degrading 命中」
// 即 _fieldH 必须 >= 0.3。H = 0.4U + 0.3D - 0.3A。
// U 提取 identityCoherence/_fieldU/ok/confidence/stability；
// D 提取 quality/_fieldD/success/cognitiveLoad/awareness；
// A 提取 dissonance/_fieldA/severity/goalValid/valid/ok。
// 注意 A 的提取器含 goalValid 与 valid：传 false 会被当 0（falsy）→ A=0，
// 于是 H = 0.4U+0.3D，只要 U/D 有一个 ≥0.45 即可 H≥0.3。
const CASES = {
  'goal-invalid': { quality: 0.9, goalValid: false },
  'goal-unethical': { quality: 0.9, goalEthical: false },
  'goal-needs-post-resolution': { quality: 0.9, postResolution: 'pending' },
  'prevent-overthinking': { quality: 0.9, thoughtChain: [1, 2, 3, 4, 5, 6], confidence: 0.3 },
  'field-stable': { quality: 0.9, _fieldH: 0.6, _fieldA: 0.2, _fieldU: 0.4 },
  'field-resonance': { quality: 0.9, _fieldResonance: true, _fieldResonanceSteps: 4, _fieldH: 0.6, _fieldA: 0.2, _fieldU: 0.4 },
  'field-reversal': { quality: 0.9, _fieldFlipAlert: 'primary', _fieldA: 0.2, _fieldU: 0.4 },
  'field-peak-reversal': { quality: 0.9, _fieldPeakReversal: true, _fieldA: 0.2, _fieldU: 0.4 },
  'error-severity': { quality: 0.9, severity: 'CRITICAL' },
  'identity-drift': { quality: 0.9, identityCoherence: 0.2 },
};

const out = {};
for (const id of Object.keys(CASES)) {
  out[id] = run(id, CASES[id]);
  console.log(
    id.padEnd(26),
    'self', String(out[id].selfMatch).padEnd(5), String(out[id].selfConf).padEnd(5),
    '| engine', out[id].engineType.padEnd(11), String(out[id].engineConf).padEnd(5),
    out[id].engineRuleId.padEnd(24),
    '| inList', String(out[id].inList).padEnd(5), '[' + out[id].all.join(',') + ']'
  );
}
console.log('\n--- 场域门禁对照：空输入恒触发 field-degrading ---');
console.log(JSON.stringify(run('field-degrading', {}), null, 1));
