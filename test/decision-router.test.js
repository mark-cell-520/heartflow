#!/usr/bin/env node
/**
 * test/decision-router.test.js
 *
 * 第 220 轮重写：把「崩溃当预期」形式的假绿测试换成真断言。
 *
 * 背景（第 218 轮暴露的结构性问题）：
 *   本文件原第 22 行只写
 *     assert.doesNotThrow(() => { try { dr.evaluate(null); } catch (e) {} });
 *   —— catch 吞掉一切，evaluate 恒抛 activeRules is not defined 的那段时间
 *   这里依然全绿。且本文件 0 断言覆盖规则匹配（matched / decision.type /
 *   规则数三个维度都没断），导致「测试全绿 ≠ 功能正常」长期并存。
 *
 * 本轮按实测（scripts/round-220/probe-r220-semantics.js）写确定性断言：
 *   · 规则集规模与每条规则的函数字段齐备
 *   · flash profile 阈值契约
 *   · 6 条规则的命中语义（含 confidence<=0 → 不命中）
 *   · 非对象输入早退契约（decision:null, matched:false, rules:[]）
 *   · 抑制窗口（同实例同规则 10s 内二次命中被抑制）
 *   · 恶意规则 match() 抛错不炸掉整次 evaluate（per-rule try/catch）
 *   · stats.totalEvaluations 递增
 *   · 兜底 hold 决策结构
 *   · 218 轮修的 activeRules 恒崩：CED 分支必须真被走进
 *
 * 判据纪律：查内容不只查布尔存在——matched / decision.type / confidence /
 * ruleId / rules 数组全部断言可读值。
 */
const assert = require('assert');
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

// 每个用例用新实例，避免抑制窗口跨用例串味
const newDr = () => new DecisionRouter({}, { modelProfile: 'flash' });

console.log('=== decision-router 规则匹配真断言（第 220 轮）===\n');

// ── 1. 实例化与基础契约 ────────────────────────────────────────────
ok('实例化成功', () => {
  const dr = newDr();
  assert.ok(dr);
});

ok('evaluate 方法存在且为函数', () => {
  const dr = newDr();
  assert.strictEqual(typeof dr.evaluate, 'function');
});

ok('getStats 可调用', () => {
  const dr = newDr();
  assert.strictEqual(typeof dr.getStats, 'function');
  const s = dr.getStats();
  assert.ok(s && typeof s === 'object');
  assert.strictEqual(typeof s.totalEvaluations, 'number');
});

// ── 2. 规则集规模与结构完整性（原文件 0 断言覆盖） ─────────────────
ok('规则集规模为 34 条（实测口径，防规则被误删/误增）', () => {
  const dr = newDr();
  assert.strictEqual(dr._rules.length, 34, `实际规则数 ${dr._rules.length}`);
});

ok('每条规则具备 id/decision/match/confidence/rationale 四类字段', () => {
  const dr = newDr();
  for (const r of dr._rules) {
    assert.ok(typeof r.id === 'string' && r.id.length > 0, `规则缺 id: ${JSON.stringify(r).slice(0, 60)}`);
    assert.ok(typeof r.decision === 'string' && r.decision.length > 0, `规则 ${r.id} 缺 decision`);
    assert.strictEqual(typeof r.match, 'function', `规则 ${r.id} 的 match 不是函数`);
    assert.strictEqual(typeof r.confidence, 'function', `规则 ${r.id} 的 confidence 不是函数`);
    assert.strictEqual(typeof r.rationale, 'function', `规则 ${r.id} 的 rationale 不是函数`);
  }
});

ok('规则 id 无重复', () => {
  const dr = newDr();
  const ids = dr._rules.map(r => r.id);
  assert.strictEqual(new Set(ids).size, ids.length, '存在重复 rule id');
});

ok('decision 取值收敛在已知决策集合内', () => {
  const dr = newDr();
  const known = new Set(['pause', 'accelerate', 'heal', 'turn', 'hold', 'resonate', 'transmit']);
  for (const r of dr._rules) {
    assert.ok(known.has(r.decision), `未知 decision 类型: ${r.id}=${r.decision}`);
  }
});

// ── 3. flash profile 阈值契约 ─────────────────────────────────────
ok('flash profile 阈值契约 floor/standard/high/fallback', () => {
  const dr = newDr();
  const T = dr._thresholds;
  assert.strictEqual(T.floor, 0.3);
  assert.strictEqual(T.standard, 0.5);
  assert.strictEqual(T.high, 0.7);
  assert.strictEqual(T.fallback, 0.4);
});

// ── 4. 规则命中语义（实测确定性 case） ────────────────────────────
ok('cognitiveLoad 超过 high → pause，confidence 0.9', () => {
  const dr = newDr();
  const r = dr.evaluate({ cognitiveLoad: 0.8 }, 'probe', 'overload-high');
  assert.strictEqual(r.matched, true, '命中应为 true');
  assert.strictEqual(r.decision.type, 'pause');
  assert.ok(Math.abs(r.decision.confidence - 0.9) < 1e-9, `confidence 应 0.9，实际 ${r.decision.confidence}`);
  assert.strictEqual(r.decision.ruleId, 'cognitive-overload');
  assert.deepStrictEqual(r.rules.map(x => x.ruleId), ['cognitive-overload']);
});

ok('cognitiveLoad 落 standard~high 之间 → confidence 0.6，仍命中 pause', () => {
  const dr = newDr();
  const r = dr.evaluate({ cognitiveLoad: 0.6 }, 'probe', 'overload-mid');
  assert.strictEqual(r.matched, true, 'confidence 0.6 > 0 应算命中');
  assert.strictEqual(r.decision.type, 'pause');
  assert.ok(Math.abs(r.decision.confidence - 0.6) < 1e-9, `confidence 应 0.6，实际 ${r.decision.confidence}`);
  assert.strictEqual(r.decision.ruleId, 'cognitive-overload');
  assert.deepStrictEqual(r.rules.map(x => x.ruleId), ['cognitive-overload']);
});

ok('cognitiveLoad 低于 standard → confidence 计 0，不命中走 hold', () => {
  const dr = newDr();
  const r = dr.evaluate({ cognitiveLoad: 0.01 }, 'probe', 'overload-low');
  assert.strictEqual(r.matched, false, 'confidence 为 0 时不应算命中');
  assert.strictEqual(r.decision.type, 'hold', '无匹配时应走兜底 hold');
  assert.strictEqual(r.decision.ruleId, 'default-hold');
  assert.deepStrictEqual(r.rules, []);
});

ok('低负荷 + 方向明确 → accelerate，confidence 0.85', () => {
  const dr = newDr();
  const r = dr.evaluate({ cognitiveLoad: 0.1, directionClear: 0.8 }, 'probe', 'clarity');
  assert.strictEqual(r.matched, true);
  assert.strictEqual(r.decision.type, 'accelerate');
  assert.ok(Math.abs(r.decision.confidence - 0.85) < 1e-9, `confidence 应 0.85，实际 ${r.decision.confidence}`);
  assert.strictEqual(r.decision.ruleId, 'cognitive-clarity');
});

ok('dissonance 超过 high → heal，confidence 0.9', () => {
  const dr = newDr();
  const r = dr.evaluate({ dissonance: 0.8 }, 'probe', 'dissonance');
  assert.strictEqual(r.matched, true);
  assert.strictEqual(r.decision.type, 'heal');
  assert.ok(Math.abs(r.decision.confidence - 0.9) < 1e-9, `confidence 应 0.9，实际 ${r.decision.confidence}`);
  assert.strictEqual(r.decision.ruleId, 'cognitive-dissonance');
});

ok('quality 低于 fallback 阈值 → pause，confidence 0.7+(1-q)*0.3', () => {
  const dr = newDr();
  const r = dr.evaluate({ quality: 0.3 }, 'probe', 'quality-low');
  assert.strictEqual(r.matched, true);
  assert.strictEqual(r.decision.type, 'pause');
  assert.ok(Math.abs(r.decision.confidence - 0.91) < 1e-9, `confidence 应 0.91，实际 ${r.decision.confidence}`);
  assert.strictEqual(r.decision.ruleId, 'decision-degrading');
});

ok('命中项的 rationale 为非空字符串（审计链可读）', () => {
  const dr = newDr();
  const r = dr.evaluate({ cognitiveLoad: 0.8 }, 'probe', 'rationale');
  assert.strictEqual(typeof r.decision.rationale, 'string');
  assert.ok(r.decision.rationale.length > 0, 'rationale 不应为空');
  assert.ok(typeof r.decision.timestamp === 'number', 'timestamp 应为数字');
  assert.strictEqual(typeof r.decision.priority, 'number', 'priority 应为数字');
});

// ── 5. 非对象输入早退契约（原假绿测试守护的位置） ─────────────────
ok('null / undefined / 数字 / 字符串 / 布尔 输入统一早退', () => {
  const dr = newDr();
  for (const bad of [null, undefined, 42, 'str', true]) {
    const r = dr.evaluate(bad, 'probe', 'early-exit');
    assert.ok(r && typeof r === 'object', `${String(bad)} 应返回对象`);
    assert.strictEqual(r.decision, null, `${String(bad)} 的 decision 应为 null（早退，不造兜底）`);
    assert.strictEqual(r.matched, false, `${String(bad)} 的 matched 应为 false`);
    assert.deepStrictEqual(r.rules, [], `${String(bad)} 的 rules 应为空数组`);
  }
});

// ── 6. 抑制窗口（同实例同规则 10s 内二次命中被抑制） ──────────────
ok('抑制窗口内同规则二次命中被抑制并转 hold', () => {
  const dr = newDr();
  const a = dr.evaluate({ cognitiveLoad: 0.8 }, 'probe', 'sup-1');
  assert.strictEqual(a.matched, true, '首次应命中');
  const b = dr.evaluate({ cognitiveLoad: 0.8 }, 'probe', 'sup-2');
  assert.strictEqual(b.matched, false, '窗口内二次应被抑制');
  assert.strictEqual(b.decision.type, 'hold', '抑制后应走兜底 hold');
  assert.strictEqual(b.decision.ruleId, 'default-hold');
  assert.strictEqual(dr.getStats().suppressedCount, 1, 'suppressedCount 应记 1 次');
});

// ── 7. 恶意规则容错（match/confidence 抛错不炸掉整次 evaluate） ────
ok('单条规则 match() 抛错不阻断其余规则与整次 evaluate', () => {
  const dr = newDr();
  dr._rules.push({
    id: 'evil-throw-rule', decision: 'heal',
    match: () => { throw new Error('boom'); },
    confidence: () => 0.9, rationale: () => 'x', fallback: null,
  });
  let threw = null, r = null;
  try { r = dr.evaluate({ cognitiveLoad: 0.8 }, 'probe', 'evil'); }
  catch (e) { threw = e.message; }
  assert.strictEqual(threw, null, `evaluate 不应抛错: ${threw}`);
  assert.ok(r && r.matched === true, '恶意规则之外的正常规则仍应命中');
  assert.ok(!r.rules.some(x => x.ruleId === 'evil-throw-rule'), '抛错规则不应进命中列表');
});

// ── 8. stats 递增契约 ────────────────────────────────────────────
ok('evaluate 使 totalEvaluations 递增', () => {
  const dr = newDr();
  const before = dr.getStats().totalEvaluations;
  assert.strictEqual(before, 0, '新实例应从 0 起');
  dr.evaluate({ cognitiveLoad: 0.5 }, 'probe', 'stats');
  const after = dr.getStats();
  assert.strictEqual(after.totalEvaluations, 1, '递增 1');
  assert.strictEqual(after.rulesCount, 34, 'rulesCount 应为 34');
});

// ── 9. 218 轮修复回归：CED 分支必须真被走进 ──────────────────────
ok('CED 分支被走进（_lastCedStrategy 非空，防 activeRules 恒崩复发）', () => {
  const dr = newDr();
  let threw = null;
  try { dr.evaluate({ cognitiveLoad: 0.8 }, 'probe', 'ced', null, null); }
  catch (e) { threw = e.message; }
  assert.strictEqual(threw, null, `evaluate 不应抛错（原恒抛 activeRules is not defined）: ${threw}`);
  const s = dr._lastCedStrategy;
  assert.ok(s && typeof s === 'object', '_lastCedStrategy 应非空（修复前恒 null）');
  assert.strictEqual(typeof s.activateRatio, 'number');
  assert.ok(!!s.mode, 'strategy.mode 应有值');
  assert.ok(Array.isArray(dr._activeRulesForEval) && dr._activeRulesForEval.length > 0,
    '_activeRulesForEval 应为非空数组');
});

console.log(`\ndecision-router: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
