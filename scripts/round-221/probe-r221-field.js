// 第 221 轮探针 H：field-* 六条规则为何全不命中（含 field-reversal /
// field-peak-reversal / field-resonance-decay 的实例状态依赖），
// 以及「关 CED + 手动注入场域字段」通路能否让它们命中。
//
// 实测背景：field-degrading/field-reversal/field-peak-reversal/field-stable/
// field-resonance/field-resonance-decay 六条的 match 都读 `_field*` 字段，
// 而这些字段由 `_updateFieldTracking` **每次 evaluate 前重新算后覆盖**，
// 调用方传的输入会被覆盖掉 —— 所以外部输入无法直接驱动它们。
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

function probe(label, input, opts) {
  const d = new DecisionRouter({}, Object.assign({ modelProfile: 'flash' }, opts || {}));
  const res = d.evaluate(input, 'p', 'x');
  console.log(
    label.padEnd(34),
    res.decision.type.padEnd(11),
    String(Math.round(res.decision.confidence * 1000) / 1000).padEnd(5),
    res.decision.ruleId.padEnd(24),
    '[' + res.rules.map(x => x.ruleId).join(',') + ']'
  );
  return d;
}

console.log('=== A. 默认（CED 开）：field-* 直接给 _field* 字段 ===');
probe('field-reversal 投 _fieldFlipAlert', { _fieldFlipAlert: 'primary', quality: 0.9 }, null);
probe('field-peak 投 _fieldPeakReversal', { _fieldPeakReversal: true, quality: 0.9 }, null);

console.log('\n=== B. 关 CED ===');
probe('field-reversal (no CED)', { _fieldFlipAlert: 'primary', quality: 0.9 }, { cedEnabled: false });
probe('field-peak (no CED)', { _fieldPeakReversal: true, quality: 0.9 }, { cedEnabled: false });

console.log('\n=== C. 多步 warm-up 让 _updateFieldTracking 自己产出翻转/谐振信号 ===');
// 场域检测要有 >=4 步历史；连续喂相同输入让 A 僵死 + D 趋平，
// 或喂高质量输入让 H 落进谐振窗口。
(() => {
  const d = new DecisionRouter({}, { modelProfile: 'flash', cedEnabled: false });
  const log = [];
  for (let i = 0; i < 8; i++) {
    const res = d.evaluate({ quality: 0.55, identityCoherence: 0.9 }, 'p', 'warm-' + i);
    log.push({
      i,
      best: res.decision.ruleId,
      all: res.rules.map(x => x.ruleId),
      fieldH: Math.round((res.field && res.field._fieldH || 0) * 1000) / 1000,
      fieldA: Math.round((res.field && res.field._fieldA || 0) * 1000) / 1000,
      flip: res.field && res.field._fieldFlipAlert,
      reso: res.field && res.field._fieldResonance,
      resoSteps: res.field && res.field._fieldResonanceSteps,
    });
  }
  for (const l of log) console.log(JSON.stringify(l));
})();

console.log('\n=== D. field-resonance-decay：需 active=false 且 lastExitReason=A_exceeded ===');
(() => {
  const d = new DecisionRouter({}, { modelProfile: 'flash', cedEnabled: false });
  // 先进入谐振（H 落窗口），再用高 A 输入退出
  for (let i = 0; i < 4; i++) d.evaluate({ quality: 0.55, identityCoherence: 0.9 }, 'p', 'reson-' + i);
  const before = { active: d._resonanceState.active, exit: d._resonanceState.lastExitReason };
  const r = d.evaluate({ dissonance: 0.9, quality: 0.9 }, 'p', 'decay-1');
  console.log('before', JSON.stringify(before));
  console.log('after  ' + JSON.stringify({ active: d._resonanceState.active, exit: d._resonanceState.lastExitReason }));
  console.log('best   ', r.decision.ruleId, '[' + r.rules.map(x => x.ruleId).join(',') + ']');
})();
