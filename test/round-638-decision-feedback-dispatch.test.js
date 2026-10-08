#!/usr/bin/env node
/**
 * round-638-decision-feedback-dispatch.test.js
 *
 * 守卫：decisionFeedback（决策反馈学习引擎）必须注册进 _modules，
 *       其 8 个公有方法必须对 dispatch 调用方可达。
 *
 * 背景（r638）：实例在 heartflow.js L2820 一直在构造，think() 主链路上
 * 已有 4 处真实消费（sync/async supervision、自动决策闭环、定期优先级
 * 调整），但那四处全部走 this.decisionFeedback 字段直调 —— dispatch /
 * MCP / 外部 agent 侧此前 100% 抛 'route not allowed'，
 * 「哪条辨别规则在真实流量里准不准」这套自评数据完全不可见。
 *
 * 负例（注入-删条-必须变红）：删掉注册块后 dispatch 必须重新抛
 * 'route not allowed'。守卫失效 = 测试必须红。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const HF = path.join(ROOT, 'src', 'core', 'heartflow.js');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '  → ' + e.message); }
}
function boot() {
  const { HeartFlow } = require(HF);
  const hf = new HeartFlow();
  hf.start();
  return hf;
}

console.log('# round-638 decisionFeedback dispatch 守卫');

// ── 1. 接线面 ────────────────────────────────────────────────────────────
t('hf.decisionFeedback 实例存在', () => {
  const hf = boot();
  assert.ok(hf.decisionFeedback, '实例应为真值');
});

t("_modules 有 'decisionFeedback' 键", () => {
  const hf = boot();
  assert.ok(Object.prototype.hasOwnProperty.call(hf._modules, 'decisionFeedback'),
    "_modules 缺少 'decisionFeedback' 键（158 键里应为 159）");
  assert.strictEqual(hf._modules.decisionFeedback, hf.decisionFeedback,
    '_modules 里的必须是同一个常驻实例，不能是新造的临时实例');
});

t('routes() 暴露 decisionFeedback.* 8 条', () => {
  const hf = boot();
  const table = hf.routes();
  assert.ok(Array.isArray(table.decisionFeedback),
    "routes() 表里没有 'decisionFeedback' 数组");
  assert.ok(table.decisionFeedback.length >= 8,
    '应至少 8 个公有方法路由，实得 ' + table.decisionFeedback.length);
});

const PUB_METHODS = [
  'recordOutcome', 'getAdjustedWeight', 'getRuleEffectiveness',
  'getAllEffectiveness', 'adjustPriorities', 'getStats', 'save', 'load',
];
t('dispatch 8/8 公有方法不抛 route not allowed', () => {
  const hf = boot();
  const bad = [];
  for (const m of PUB_METHODS) {
    try { hf.dispatch('decisionFeedback.' + m, {}); }
    catch (e) {
      if (!/not allowed/.test(String(e && e.message))) bad.push(m); // 非路由类错误另行处理
    }
  }
  assert.strictEqual(bad.length, 0, '这些方法 dispatch 抛了非路由错误: ' + bad.join(','));
});

// ── 2. 辨别力：非常量函数 ────────────────────────────────────────────────
t('recordOutcome 提权：3 对 → weight 1.0→1.15', () => {
  const hf = boot();
  const m = hf._modules.decisionFeedback;
  const rid = 'r638_pos_' + Date.now();
  assert.strictEqual(m.getAdjustedWeight(rid), 1.0, '未记录过应为基准权重 1.0');
  for (let i = 0; i < 3; i++) m.recordOutcome({ type: 'probe', ruleId: rid, confidence: 0.9 }, true, 't');
  assert.ok(Math.abs(m.getAdjustedWeight(rid) - 1.15) < 1e-9,
    '连续 3 次判对应 +0.05×3 = 1.15，实得 ' + m.getAdjustedWeight(rid));
});

t('recordOutcome 降权：判错 → weight -0.10', () => {
  const hf = boot();
  const m = hf._modules.decisionFeedback;
  const rid = 'r638_neg_' + Date.now();
  m.recordOutcome({ type: 'probe', ruleId: rid, confidence: 0.9 }, true, 't');
  const before = m.getAdjustedWeight(rid);
  m.recordOutcome({ type: 'probe', ruleId: rid, confidence: 0.9 }, false, 't');
  assert.ok(Math.abs(m.getAdjustedWeight(rid) - (before - 0.10)) < 1e-9,
    '判错一次应 -0.10，实得 ' + m.getAdjustedWeight(rid));
});

t('错误降权触底 minWeight 0.1（不会变负数）', () => {
  const hf = boot();
  const m = hf._modules.decisionFeedback;
  const rid = 'r638_floor_' + Date.now();
  for (let i = 0; i < 15; i++) m.recordOutcome({ type: 'probe', ruleId: rid, confidence: 0.3 }, false, 't');
  const w = m.getAdjustedWeight(rid);
  assert.ok(w >= 0.1 && Math.abs(w - 0.1) < 1e-9, '应触底在 0.1，实得 ' + w);
});

t('getRuleEffectiveness 准确率与计数', () => {
  const hf = boot();
  const m = hf._modules.decisionFeedback;
  const rid = 'r638_eff_' + Date.now();
  for (let i = 0; i < 3; i++) m.recordOutcome({ type: 'probe', ruleId: rid, confidence: 0.9 }, true, 't');
  m.recordOutcome({ type: 'probe', ruleId: rid, confidence: 0.9 }, false, 't');
  const eff = m.getRuleEffectiveness(rid);
  assert.strictEqual(eff.totalDecisions, 4, '总决策应 4，实得 ' + eff.totalDecisions);
  assert.strictEqual(eff.correctCount, 3, '对 3');
  assert.strictEqual(eff.wrongCount, 1, '错 1');
  assert.strictEqual(eff.accuracy, 0.75, '准确率应 0.75，实得 ' + eff.accuracy);
});

t('缺 type/ruleId 被契约拒绝（不污染统计）', () => {
  const hf = boot();
  const m = hf._modules.decisionFeedback;
  const r = m.recordOutcome({ type: 'x' }, true, 't');
  assert.strictEqual(r.adjusted, false, '缺 ruleId 应拒绝调整');
  assert.ok(/ruleId/.test(String(r.error)), '错误信息应点名 ruleId');
  const st = m.getStats();
  assert.strictEqual(st.totalTracked, 0, '被拒的调用不应计入 totalTracked');
});

t('adjustPriorities 按准确率双向调权（高提 / 低降）', () => {
  const hf = boot();
  const m = hf._modules.decisionFeedback;
  const { DECISION_PRIORITY } = require(path.join(ROOT, 'src', 'core', 'decision-router.js'));
  const keys = Object.keys(DECISION_PRIORITY);
  const hi = keys[0], lo = keys[1] || keys[0];
  for (let i = 0; i < 20; i++) m.recordOutcome({ type: hi, ruleId: 'r638_hi_' + Date.now(), confidence: 0.9 }, true, 't');
  for (let i = 0; i < 20; i++) m.recordOutcome({ type: lo, ruleId: 'r638_lo_' + Date.now(), confidence: 0.9 }, false, 't');
  const adj = m.adjustPriorities();
  assert.strictEqual(adj.adjusted, true, '应有调整发生');
  assert.ok(adj.adjustments.some(a => a.type === hi && a.newPriority > a.oldPriority),
    '100% 准确的 type 应被提权');
  assert.ok(adj.adjustments.some(a => a.type === lo && a.newPriority < a.oldPriority),
    '0% 准确的 type 应被降权');
});

t('getStats 汇总含 rulesLearning 权重明细', () => {
  const hf = boot();
  const m = hf._modules.decisionFeedback;
  const rid = 'r638_stats_' + Date.now();
  m.recordOutcome({ type: 'probe', ruleId: rid, confidence: 0.9 }, true, 't');
  const st = m.getStats();
  assert.ok(st.rulesLearning && st.rulesLearning[rid], 'rulesLearning 应含该规则');
  assert.strictEqual(st.rulesLearning[rid].accuracy, 1, '准确率应 1');
  assert.strictEqual(st.totalTracked, 1, 'totalTracked 应 1');
});

// ── 3. 负例：删注册块 → 必须变红 ─────────────────────────────────────────
(function negativeCase() {
  console.log('  ── 负例：删掉 _modules 注册块 ──');
  const src = fs.readFileSync(HF, 'utf8');
  const lines = src.split('\n');
  // 定位注册块：从注释 [r638] 起，到 _modules 赋值行止，整段删除（行级，不切断语法）
  const startIdx = lines.findIndex(l => /\[r638\] decisionFeedback 接线/.test(l));
  assert.ok(startIdx >= 0, '负例失败：没能在源码里定位到 r638 注册注释块（守卫的对象漂移了）');
  let endIdx = -1;
  for (let i = startIdx; i < lines.length; i++) {
    if (/this\._modules\['decisionFeedback'\] = this\.decisionFeedback;/.test(lines[i])) { endIdx = i; break; }
  }
  assert.ok(endIdx > startIdx, '负例失败：定位到注释但没找到赋值行');
  // 关键：if 块的右花括号在赋值行的下一行，必须一起删，否则留下孤立 `}`
  if (/^\s*\}\s*$/.test(lines[endIdx + 1] || '')) endIdx += 1;
  const removed = lines.splice(startIdx, endIdx - startIdx + 1, '  /* r638 negative: registration block removed */');
  assert.ok(/this\._modules\['decisionFeedback'\]/.test(removed.join('\n')),
    '负例失败：删除的块里不含目标赋值行');
  const stripped = lines.join('\n');

  const NEG = path.join(ROOT, 'src', 'core', '__neg638.js');
  fs.writeFileSync(NEG, stripped);
  try {
    delete require.cache[require.resolve(NEG)];
    const { HeartFlow: HFNeg } = require(NEG);
    const hf = new HFNeg();
    hf.start();
    let na = 0, other = [];
    for (const m of PUB_METHODS) {
      try { hf.dispatch('decisionFeedback.' + m, {}); }
      catch (e) { /not allowed/.test(String(e.message)) ? na++ : other.push(m); }
    }
    assert.strictEqual(na, PUB_METHODS.length,
      '删注册块后应全部 route not allowed，实得 na=' + na + ' other=' + other.join(','));
    assert.strictEqual(other.length, 0, '出现非路由错误: ' + other.join(','));
    console.log('  PASS  [负例] 删块后 8/8 抛 route not allowed（守卫有效）');
    passed++;
  } catch (e) {
    console.log('  FAIL  [负例] ' + e.message);
    failed++;
  } finally {
    try { fs.unlinkSync(NEG); } catch (_) {}
  }
})();

// ── 4. 主链路未被本次接线破坏 ────────────────────────────────────────────
t('checkOutput 仍可跑（接线不阻断主链路）', () => {
  const { checkOutput } = require(path.join(ROOT, 'src', 'gate.js'));
  const r = checkOutput('这是一个中性的测试句子，用来确认主链路没有被本次接线破坏。');
  assert.ok(r && r.gate && typeof r.gate.action === 'string', 'checkOutput 应返回带 gate.action 的结果');
  assert.ok(['pass', 'verify', 'rewrite', 'block'].includes(r.gate.action),
    'gate.action 应合法，实得 ' + r.gate.action);
});

console.log('\n# 汇总: ' + passed + ' 过 / ' + failed + ' 败');
if (failed > 0) process.exit(1);
