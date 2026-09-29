#!/usr/bin/env node
/**
 * test/decision-router-rule-coverage-r221.test.js
 *
 * 第 221 轮新增：把 34 条决策规则中**尚未有真断言**的那些补齐。
 * 第 220 轮只覆盖了 6 条（cognitive-overload / cognitive-clarity /
 * cognitive-dissonance / decision-degrading + 早退契约），
 * 其余 28 条在「测试全绿 ≠ 功能正常」意义上仍是盲区 ——
 * error-severity 的大小写 bug 正是在这个盲区里被本轮探针挖出来的
 * （toUpperCase 与 ['critical','high','FATAL'] 比较，后三者永不相等，
 *   severity:'CRITICAL' / 'High' / 'FATAL' 全部漏判）。
 *
 * 断言口径（第 220/221 轮实测教训的共同结论）：
 *   1. 一实例一 case —— 抑制窗口是跨调用的隐藏状态，连跑会污染语义。
 *   2. 关 CED —— 默认 evaluate 只放 18 条规则参与仲裁（CED 按 input
 *      复杂度裁人），16 条规则从未被执行，断言它们必须先 cedEnabled:false。
 *   3. 单规则 match/confidence/rationale 直接调用 —— 绕过 evaluate 的
 *      优先级仲裁与 _updateFieldTracking 的字段覆盖，
 *      拿确定性命中/置信度/有理据三元组。
 *
 * 负例守卫：scripts/negative-test-decision-router-rule-coverage-r221.js
 */
const assert = require('assert');
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

const newDr = (opts) => new DecisionRouter({}, Object.assign({ modelProfile: 'flash' }, opts || {}));

console.log('=== decision-router 34 条规则语义覆盖（第 221 轮）===\n');

// ── 0. 单规则直调 API：确定性命中语义 ─────────────────────────────
ok('单规则直调 API 可用（match/confidence/rationale）', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'identity-drift');
  assert.ok(r, 'identity-drift 规则应存在');
  assert.strictEqual(r.match({ identityCoherence: 0.2 }), true);
  assert.strictEqual(r.confidence({ identityCoherence: 0.2 }), 0.8);
  assert.ok(typeof r.rationale({ identityCoherence: 0.2 }) === 'string');
});

// ── 1. error-severity 大小写契约（本轮修的 bug 的回归防线） ────────
ok('error-severity 命中 critical / CRITICAL / High / FATAL 四种写法（本轮 bug 回归）', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'error-severity');
  assert.strictEqual(r.decision, 'heal');
  for (const sev of ['critical', 'CRITICAL', 'high', 'High', 'fatal', 'FATAL']) {
    assert.strictEqual(r.match({ severity: sev }), true, `severity '${sev}' 应命中`);
  }
  // 负例：不在这三档的 severity 不命中
  for (const sev of ['medium', 'low', 'TRANSIENT', 'MEDIUM']) {
    assert.strictEqual(r.match({ severity: sev }), false, `severity '${sev}' 不应命中`);
  }
  assert.strictEqual(r.match({}), false, '缺 severity 字段不应命中');
  assert.strictEqual(r.confidence({ severity: 'CRITICAL' }), 0.95);
});

ok('error-severity 的 confidence 与 severity 取值无关（恒定 0.95）', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'error-severity');
  assert.strictEqual(r.confidence({ severity: 'critical' }), 0.95);
  assert.strictEqual(r.confidence({ severity: 'FATAL' }), 0.95);
});

// ── 2. 身份/信念/目标族单规则语义 ────────────────────────────────
ok('identity-drift：identityCoherence 低于 standard → turn，confidence 1-值', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'identity-drift');
  assert.strictEqual(r.decision, 'turn');
  assert.strictEqual(r.match({ identityCoherence: 0.2 }), true);
  assert.ok(Math.abs(r.confidence({ identityCoherence: 0.2 }) - 0.8) < 1e-9);
  assert.strictEqual(r.match({ identityCoherence: 0.8 }), false, '高于 standard 不应命中');
  assert.strictEqual(r.match({}), false, '缺字段不命中');
});

ok('belief-broken：ok=false → heal 0.85；belief-stable：ok=true → hold 取 confidence', () => {
  const dr = newDr();
  const broken = dr._rules.find(x => x.id === 'belief-broken');
  assert.strictEqual(broken.decision, 'heal');
  assert.strictEqual(broken.match({ ok: false }), true);
  assert.strictEqual(broken.confidence({ ok: false }), 0.85);
  assert.strictEqual(broken.match({ ok: true }), false);

  const stable = dr._rules.find(x => x.id === 'belief-stable');
  assert.strictEqual(stable.decision, 'hold');
  assert.strictEqual(stable.match({ ok: true }), true);
  assert.strictEqual(stable.confidence({ ok: true, confidence: 0.7 }), 0.7);
  assert.strictEqual(stable.confidence({ ok: true }), 0.5, '缺 confidence 回落 T.standard');
});

ok('goal-unethical / goal-invalid / goal-needs-post-resolution 三兄弟语义分明', () => {
  const dr = newDr();
  const un = dr._rules.find(x => x.id === 'goal-unethical');
  assert.strictEqual(un.decision, 'turn');
  assert.strictEqual(un.match({ goalEthical: false }), true);
  assert.strictEqual(un.confidence({ goalEthical: false }), 0.9);

  const inv = dr._rules.find(x => x.id === 'goal-invalid');
  assert.strictEqual(inv.decision, 'pause');
  assert.strictEqual(inv.match({ goalValid: false }), true);
  assert.strictEqual(inv.confidence({ goalValid: false }), 0.8);

  const post = dr._rules.find(x => x.id === 'goal-needs-post-resolution');
  assert.strictEqual(post.decision, 'pause');
  assert.strictEqual(post.match({ postResolution: 'pending' }), true);
  assert.strictEqual(post.confidence({ postResolution: 'pending' }), 0.6);
  assert.strictEqual(post.match({ postResolution: null }), false, 'null 不命中');
});

// ── 3. 成本/知识/元认知族 ──────────────────────────────────────
ok('cost-aware：estimatedCost > 0.05 → hold 0.7，否则 confidence 计 0', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'cost-aware');
  assert.strictEqual(r.decision, 'hold');
  assert.strictEqual(r.match({ estimatedCost: 0.2 }), true);
  assert.strictEqual(r.confidence({ estimatedCost: 0.2 }), 0.7);
  assert.strictEqual(r.match({ cost: 0.01 }), true, '只要字段存在就算 match');
  assert.strictEqual(r.confidence({ cost: 0.01 }), 0, '低成本 confidence 应为 0（上层会 continue）');
  assert.strictEqual(r.match({}), false, '两个字段都缺不命中');
});

ok('knowledge-transmissible：quality>high 且 confidence>standard → transmit，均值置信', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'knowledge-transmissible');
  assert.strictEqual(r.decision, 'transmit');
  assert.strictEqual(r.match({ quality: 0.8, confidence: 0.6 }), true);
  assert.ok(Math.abs(r.confidence({ quality: 0.8, confidence: 0.6 }) - 0.7) < 1e-9);
  assert.strictEqual(r.match({ quality: 0.8 }), false, '缺 confidence 不命中');
  assert.strictEqual(r.match({ quality: 0.5, confidence: 0.6 }), false, 'quality 未过 high 不命中');
});

ok('counterfactual-insight：alternatives 非空 → resonate，置信按条数封顶 0.8', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'counterfactual-insight');
  assert.strictEqual(r.decision, 'resonate');
  assert.strictEqual(r.match({ alternatives: [{}] }), true);
  assert.ok(Math.abs(r.confidence({ alternatives: [{}] }) - 0.15) < 1e-9, '1 条 → 0.15');
  assert.ok(Math.abs(r.confidence({ alternatives: [{}, {}, {}] }) - 0.45) < 1e-9, '3 条 → 0.45');
  const many = new Array(10).fill({});
  assert.strictEqual(r.confidence({ alternatives: many }), 0.8, '条数过多封顶 0.8');
  assert.strictEqual(r.match({ alternatives: [] }), false, '空数组不命中');
  assert.strictEqual(r.match({ alternatives: [{}], relevant: false }), false, 'relevant=false 显式关闭');
});

ok('meta-insight：awareness > standard → accelerate，置信即 awareness', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'meta-insight');
  assert.strictEqual(r.decision, 'accelerate');
  assert.strictEqual(r.match({ awareness: 0.8 }), true);
  assert.strictEqual(r.confidence({ awareness: 0.8 }), 0.8);
  assert.strictEqual(r.match({ awareness: 0.3 }), false, '低于 standard 不命中');
});

// ── 4. 错误/执行族 ──────────────────────────────────────────────
ok('error-transient：severity 恰为 TRANSIENT → pause 0.6', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'error-transient');
  assert.strictEqual(r.decision, 'pause');
  assert.strictEqual(r.match({ severity: 'TRANSIENT' }), true);
  assert.strictEqual(r.confidence({ severity: 'TRANSIENT' }), 0.6);
  assert.strictEqual(r.match({ severity: 'transient' }), false, '严格相等比较，小写不命中');
  assert.strictEqual(r.match({ severity: 'CRITICAL' }), false);
});

ok('execution-success / execution-failure：同字段相反值 → accelerate / heal', () => {
  const dr = newDr();
  const ok1 = dr._rules.find(x => x.id === 'execution-success');
  assert.strictEqual(ok1.decision, 'accelerate');
  assert.strictEqual(ok1.match({ success: true }), true);
  assert.strictEqual(ok1.confidence({ success: true }), 0.5, '取 T.standard');
  assert.strictEqual(ok1.match({ success: false }), false);

  const nok = dr._rules.find(x => x.id === 'execution-failure');
  assert.strictEqual(nok.decision, 'heal');
  assert.strictEqual(nok.match({ success: false }), true);
  assert.strictEqual(nok.confidence({ success: false }), 0.8);
  assert.strictEqual(nok.match({ success: true }), false);
});

ok('commonsense-failure / instability：常识与稳定性双 pause 通道', () => {
  const dr = newDr();
  const cs = dr._rules.find(x => x.id === 'commonsense-failure');
  assert.strictEqual(cs.decision, 'pause');
  assert.strictEqual(cs.match({ valid: false }), true);
  assert.strictEqual(cs.confidence({ valid: false }), 0.75);
  assert.strictEqual(cs.match({ valid: true }), false);

  const inst = dr._rules.find(x => x.id === 'instability');
  assert.strictEqual(inst.decision, 'pause');
  assert.strictEqual(inst.match({ stability: 0.1 }), true);
  assert.ok(Math.abs(inst.confidence({ stability: 0.1 }) - 0.9) < 1e-9, 'confidence = 1 - stability');
  assert.strictEqual(inst.match({ stability: 0.8 }), false, '高于 fallback 不命中');
});

// ── 5. 场域族：字段由 _updateFieldTracking 注入，外部输入会被覆盖 ──
ok('field-degrading：_fieldH < 0.3 → heal，confidence max(0.5, 0.9-H)', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'field-degrading');
  assert.strictEqual(r.decision, 'heal');
  assert.strictEqual(r.match({ _fieldH: 0.1 }), true);
  assert.ok(Math.abs(r.confidence({ _fieldH: 0.1 }) - 0.8) < 1e-9);
  assert.strictEqual(r.match({ _fieldH: 0.5 }), false, 'H 高于 0.3 不命中');
  assert.strictEqual(r.match({ _fieldH: 0.2 }), true);
  assert.ok(Math.abs(r.confidence({ _fieldH: 0.2 }) - 0.7) < 1e-9, 'max(0.5, 0.9-0.2)=0.7');
  assert.strictEqual(r.confidence({ _fieldH: 0.5 }), 0.5, '0.9-0.5=0.4 < 0.5 → 取 0.5 兜底');
});

ok('field-reversal / field-peak-reversal：翻转信号各自触发，confidence 分档', () => {
  const dr = newDr();
  const rev = dr._rules.find(x => x.id === 'field-reversal');
  assert.strictEqual(rev.decision, 'pause');
  assert.strictEqual(rev.match({ _fieldFlipAlert: 'primary' }), true);
  assert.strictEqual(rev.confidence({ _fieldFlipAlert: 'primary' }), 0.85);
  assert.strictEqual(rev.match({ _fieldFlipAlert: 'alternate1' }), true);
  assert.strictEqual(rev.confidence({ _fieldFlipAlert: 'alternate1' }), 0.7);
  assert.strictEqual(rev.match({ _fieldFlipAlert: null }), false, '无翻转不命中');

  const peak = dr._rules.find(x => x.id === 'field-peak-reversal');
  assert.strictEqual(peak.decision, 'turn');
  assert.strictEqual(peak.match({ _fieldPeakReversal: true }), true);
  assert.strictEqual(peak.confidence({ _fieldPeakReversal: true }), 0.8);
  assert.strictEqual(peak.match({ _fieldPeakReversal: false }), false);
});

ok('field-stable / field-resonance：谐振窗口内 accelerate / resonate', () => {
  const dr = newDr();
  const st = dr._rules.find(x => x.id === 'field-stable');
  assert.strictEqual(st.decision, 'accelerate');
  assert.strictEqual(st.match({ _fieldH: 0.6, _fieldA: 0.2, _fieldU: 0.4 }), true);
  assert.strictEqual(st.confidence({ _fieldH: 0.6, _fieldA: 0.2, _fieldU: 0.4 }), 0.6, 'min(0.9, H)');
  assert.strictEqual(st.match({ _fieldH: 0.6, _fieldA: 0.5, _fieldU: 0.4 }), false, 'A 未低于 0.3 不命中');
  assert.strictEqual(st.match({ _fieldH: 0.3, _fieldA: 0.2, _fieldU: 0.4 }), false, 'H 未到 0.45 不命中');

  const res = dr._rules.find(x => x.id === 'field-resonance');
  assert.strictEqual(res.decision, 'resonate');
  assert.strictEqual(res.match({ _fieldResonance: true, _fieldResonanceSteps: 4, _fieldH: 0.6 }), true);
  assert.strictEqual(res.match({ _fieldResonance: true, _fieldResonanceSteps: 2, _fieldH: 0.6 }), false, '不足 3 步不命中');
  assert.strictEqual(res.match({ _fieldResonance: false, _fieldResonanceSteps: 4 }), false, '未在谐振态不命中');
});

ok('field-resonance-decay：active=false 且上次退出因 A_exceeded → turn 0.7', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'field-resonance-decay');
  assert.strictEqual(r.decision, 'turn');
  assert.strictEqual(r.confidence({ _fieldResonance: false }), 0.7);
  // 初始实例 lastExitReason 是 null → 不命中
  assert.strictEqual(r.match({ _fieldResonance: false }), false, '初始 lastExitReason=null 不命中');
  dr._resonanceState.lastExitReason = 'A_exceeded';
  assert.strictEqual(r.match({ _fieldResonance: false }), true, 'A_exceeded 退出后命中');
  dr._resonanceState.lastExitReason = 'H_below_window';
  assert.strictEqual(r.match({ _fieldResonance: false }), false, '其它退出原因不命中');
  assert.strictEqual(r.match({ _fieldResonance: true }), false, '仍在谐振态不命中');
});

// ── 6. 抑制/代价/伦理/安全族 ────────────────────────────────────
ok('prevent-overthinking：长思维链 + 低置信 → hold 0.7', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'prevent-overthinking');
  assert.strictEqual(r.decision, 'hold');
  const long = [1, 2, 3, 4, 5, 6];
  assert.strictEqual(r.match({ thoughtChain: long, confidence: 0.3 }), true);
  assert.strictEqual(r.confidence({ thoughtChain: long, confidence: 0.3 }), 0.7);
  assert.strictEqual(r.match({ thoughtChain: [1, 2], confidence: 0.3 }), false, '链短不命中');
  assert.strictEqual(r.match({ thoughtChain: long, confidence: 0.9 }), false, '置信高不命中');
  assert.strictEqual(r.match({ chain: long }), true, 'chain 是 thoughtChain 的别名');
});

ok('challenge-received：布尔质疑信号与文本关键词双通道', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'challenge-received');
  assert.strictEqual(r.decision, 'pause');
  assert.strictEqual(r.match({ challenge: true }), true);
  assert.strictEqual(r.confidence({ challenge: true }), 0.9);
  assert.strictEqual(r.match({ correction: true }), true, 'correction 也是质疑信号');
  assert.strictEqual(r.match({ criticism: true }), true, 'criticism 也是质疑信号');
  assert.strictEqual(r.match({ challenge: false }), false, '显式 false 不命中');
  assert.strictEqual(r.match({}), false, '无信号不命中');
});

ok('value-resonance：valueResonance 超过 high → resonate，置信即值', () => {
  const dr = newDr();
  const r = dr._rules.find(x => x.id === 'value-resonance');
  assert.strictEqual(r.decision, 'resonate');
  assert.strictEqual(r.match({ valueResonance: 0.8 }), true);
  assert.strictEqual(r.confidence({ valueResonance: 0.8 }), 0.8);
  assert.strictEqual(r.match({ valueResonance: 0.5 }), false, '未过 high 不命中');
});

ok('四条 domain 规则各自只认自己的触发字段', () => {
  const dr = newDr();
  const cases = [
    ['agi-policy-shift', 'turn', { agiPolicyRisk: true }, 0.85, 'safety'],
    ['security-breach', 'heal', { securityBreach: true }, 0.95, 'safety'],
    ['smart-home-dependency', 'pause', { smartHomeDependency: true }, 0.75, 'behavior'],
    ['data-labor-exploitation', 'heal', { dataLaborExploitation: true }, 0.8, 'ethics'],
    ['build-philosophy-violation', 'turn', { buildPhilosophyViolation: true }, 0.7, 'cognition'],
  ];
  for (const [id, dec, input, conf, domain] of cases) {
    const r = dr._rules.find(x => x.id === id);
    assert.ok(r, `${id} 应存在`);
    assert.strictEqual(r.decision, dec, `${id} 的 decision 应为 ${dec}`);
    assert.strictEqual(r.domain, domain, `${id} 的 domain 应为 ${domain}`);
    assert.strictEqual(r.match(input), true, `${id} 应命中自己的触发字段`);
    assert.ok(Math.abs(r.confidence(input) - conf) < 1e-9, `${id} confidence 应 ${conf}`);
  }
  // security-breach 还有 severity==='CRITICAL' 第二触发通道
  const sb = dr._rules.find(x => x.id === 'security-breach');
  assert.strictEqual(sb.match({ severity: 'CRITICAL' }), true, 'severity=CRITICAL 也应触发 security-breach');
  assert.strictEqual(sb.match({}), false, '无触发字段不命中');
});

// ── 7. evaluate 层：CED 参与集契约（本轮实测发现） ───────────────
ok('默认 evaluate 只有 18 条规则参与仲裁（CED 按复杂度裁人）', () => {
  const dr = newDr();
  dr.evaluate({ quality: 0.9 }, 'probe', 'hi');
  assert.strictEqual(dr._activeRulesForEval.length, 18, `实际参与集 ${dr._activeRulesForEval.length}`);
  // 参与集是 34 条的子集
  assert.ok(dr._activeRulesForEval.length < dr._rules.length, '参与集应小于全量');
  const ids = new Set(dr._rules.map(x => x.id));
  for (const r of dr._activeRulesForEval) assert.ok(ids.has(r.id), '参与集成员必须来自全量规则');
});

ok('关 CED + 空输入后 34 条全部参与仲裁 —— 这是断言其余规则的前提', () => {
  // 注意：参与集规模与输入有关（_updateFieldTracking 出的场域值会影响
  // CED 的复杂度评估）。空输入 → 34 条全量；{quality:0.9} → 30 条。
  // 这是真实语义，写死一个数不如把两种都锁住。
  const drEmpty = newDr({ cedEnabled: false });
  drEmpty.evaluate({}, 'probe', 'hi');
  assert.strictEqual(drEmpty._activeRulesForEval.length, 34, `空输入关 CED 后应 34 条，实际 ${drEmpty._activeRulesForEval.length}`);

  const drQuality = newDr({ cedEnabled: false });
  drQuality.evaluate({ quality: 0.9 }, 'probe', 'hi');
  assert.ok(drQuality._activeRulesForEval.length >= 30, `{quality:0.9} 关 CED 后应 >=30 条，实际 ${drQuality._activeRulesForEval.length}`);
  assert.ok(drQuality._activeRulesForEval.length < drQuality._rules.length, '仍应小于全量（CED 关掉的是 domain 过滤不是规模）');
});

ok('关 CED + 独立实例：20 条规则可稳定成为 best（本轮仲裁语义基线）', () => {
  // 这份清单来自 scripts/round-221/probe-r221-ced.js 实测，
  // 每条都是「关 CED + 针对性输入 → 该规则胜出」。任何一条回退都说明
  // 仲裁语义被改坏了。
  const expected = {
    'cognitive-clarity': ['accelerate'],
    'cognitive-dissonance': ['heal'],
    'identity-drift': ['turn'],
    'error-severity': ['heal'],
    'error-transient': ['pause'],
    'challenge-received': ['pause'],
    'cost-aware': ['hold'],
    'value-resonance': ['resonate'],
    'knowledge-transmissible': ['transmit'],
    'counterfactual-insight': ['resonate'],
    'meta-insight': ['accelerate'],
    'belief-broken': ['heal'],
    'instability': ['pause'],
    'execution-success': ['accelerate'],
    'execution-failure': ['heal'],
    'goal-unethical': ['turn'],
    'goal-needs-post-resolution': ['pause'],
    'field-degrading': ['heal'],
    'prevent-overthinking': ['hold'],
    'build-philosophy-violation': ['turn'],
  };
  const inputs = {
    'cognitive-clarity': { cognitiveLoad: 0.1, directionClear: 0.8 },
    'cognitive-dissonance': { dissonance: 0.8 },
    'identity-drift': { identityCoherence: 0.2, quality: 0.9 },
    'error-severity': { severity: 'CRITICAL', quality: 0.9 },
    'error-transient': { severity: 'TRANSIENT', quality: 0.9 },
    'challenge-received': { challenge: true, quality: 0.9 },
    'cost-aware': { estimatedCost: 0.2, quality: 0.9 },
    'value-resonance': { valueResonance: 0.8, quality: 0.9 },
    'knowledge-transmissible': { quality: 0.8, confidence: 0.7 },
    'counterfactual-insight': { alternatives: [{}, {}, {}], quality: 0.9 },
    'meta-insight': { awareness: 0.8, quality: 0.9 },
    'belief-broken': { ok: false, quality: 0.9 },
    'instability': { stability: 0.1, quality: 0.9 },
    'execution-success': { success: true, quality: 0.9 },
    'execution-failure': { success: false, quality: 0.9 },
    'goal-unethical': { goalEthical: false, quality: 0.9 },
    'goal-needs-post-resolution': { postResolution: 'pending', quality: 0.9 },
    'field-degrading': {},
    'prevent-overthinking': { thoughtChain: [1, 2, 3, 4, 5, 6], confidence: 0.3, quality: 0.9 },
    'build-philosophy-violation': { buildPhilosophyViolation: true, quality: 0.9 },
  };
  for (const id of Object.keys(expected)) {
    const dr = newDr({ cedEnabled: false });
    const r = dr.evaluate(inputs[id], 'probe', 'arb-' + id);
    assert.strictEqual(r.decision.ruleId, id, `${id} 应胜出，实际 ${r.decision.ruleId}`);
    assert.strictEqual(r.matched, true, `${id} 应命中`);
    assert.ok(expected[id].includes(r.decision.type), `${id} 的 type 应为 ${expected[id]}`);
    assert.ok(r.rules.some(x => x.ruleId === id), `${id} 应出现在命中列表`);
  }
});

// ── 8. 34 条规则全量可直调（防止某一规则的函数字段被误删） ─────────
ok('34 条规则每条都能被 match/confidence/rationale 安全直调', () => {
  const dr = newDr();
  const probes = {
    'cognitive-overload': { cognitiveLoad: 0.8 }, 'cognitive-clarity': { cognitiveLoad: 0.1 },
    'cognitive-dissonance': { dissonance: 0.8 }, 'decision-degrading': { quality: 0.3 },
    'identity-drift': { identityCoherence: 0.2 }, 'error-severity': { severity: 'CRITICAL' },
    'error-transient': { severity: 'TRANSIENT' }, 'challenge-received': { challenge: true },
    'cost-aware': { estimatedCost: 0.2 }, 'value-resonance': { valueResonance: 0.8 },
    'knowledge-transmissible': { quality: 0.8, confidence: 0.7 },
    'counterfactual-insight': { alternatives: [{}] }, 'meta-insight': { awareness: 0.8 },
    'belief-stable': { ok: true }, 'belief-broken': { ok: false },
    'commonsense-failure': { valid: false }, 'instability': { stability: 0.1 },
    'execution-success': { success: true }, 'execution-failure': { success: false },
    'goal-invalid': { goalValid: false }, 'goal-unethical': { goalEthical: false },
    'goal-needs-post-resolution': { postResolution: 'x' }, 'field-degrading': { _fieldH: 0.1 },
    'field-reversal': { _fieldFlipAlert: 'primary' }, 'field-peak-reversal': { _fieldPeakReversal: true },
    'field-stable': { _fieldH: 0.6, _fieldA: 0.2, _fieldU: 0.4 },
    'field-resonance': { _fieldResonance: true, _fieldResonanceSteps: 4, _fieldH: 0.6 },
    'field-resonance-decay': { _fieldResonance: false }, 'prevent-overthinking': { thoughtChain: [1, 2, 3, 4, 5, 6] },
    'agi-policy-shift': { agiPolicyRisk: true }, 'security-breach': { securityBreach: true },
    'smart-home-dependency': { smartHomeDependency: true },
    'data-labor-exploitation': { dataLaborExploitation: true },
    'build-philosophy-violation': { buildPhilosophyViolation: true },
  };
  for (const r of dr._rules) {
    const input = probes[r.id] || {};
    let m = null, c = null, ra = null;
    try { m = r.match(input); c = r.confidence(input); ra = r.rationale(input); }
    catch (e) { throw new Error(`规则 ${r.id} 直调抛错: ${e.message}`); }
    assert.ok(typeof m === 'boolean', `规则 ${r.id} 的 match 应返回布尔`);
    assert.ok(typeof c === 'number' && Number.isFinite(c), `规则 ${r.id} 的 confidence 应为有限数字，实际 ${c}`);
    assert.ok(c >= 0 && c <= 1, `规则 ${r.id} 的 confidence 应在 [0,1]，实际 ${c}`);
    assert.ok(typeof ra === 'string' && ra.length > 0, `规则 ${r.id} 的 rationale 应为非空字符串`);
  }
});

console.log(`\ndecision-router 规则语义覆盖: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
