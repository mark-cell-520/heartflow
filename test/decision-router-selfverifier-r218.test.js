#!/usr/bin/env node
/**
 * test/decision-router-selfverifier-r218.test.js
 *
 * 第 218 轮新增：两条「恒崩」修复的回归防线。
 *   ① decision-router evaluate 抛 activeRules is not defined（9f1093ab 引入 CED
 *      时漏了局部变量转换）→ 每次 evaluate 全抛，CED / domain filtering 两套
 *      v6.7.70/72 能力 0 次执行
 *   ② heartflow.js SelfVerifier 段把 result.chain 对象当 reasoning 传进
 *      verify() → 每次抛 reasoning.toLowerCase is not a function，
 *      result._selfVerification 从不落地
 *
 * 判据纪律（217 轮踩坑教训）：查内容不只查布尔存在——_selfVerification 断言
 * passed/checks/issues/confidence 四个字段全部可读，evaluate 断言
 * matched/decision/规则数三个维度。
 *
 * 文件形态照 test/reflection-loop-wiring.test.js（217 轮同款、run-all 实测
 * 能跑通 IIFE async 段）：自定义 assert + 单个 async IIFE + 汇总行 + exit。
 */
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { console.error('FAIL:', msg); failed++; }
}

console.log('=== decision-router / self-verifier 恒崩修复回归（第 218 轮）===\n');

(async () => {
  // ── ① decision-router evaluate 正常路径 ───────────────────────────
  const newDr = () => new DecisionRouter({}, { modelProfile: 'flash' });

  try {
    const dr = newDr();
    const r = dr.evaluate({ type: 'probe', data: {} }, 'probe', '这个操作有风险会导致危险和伤害', null);
    assert(r && typeof r === 'object', 'evaluate 应返回对象');
    assert(typeof r.matched === 'boolean', 'matched 应为布尔，实际=' + typeof r.matched);
    assert(r.decision && typeof r.decision === 'object', 'decision 应为对象');
    assert(!!r.decision.type, 'decision.type 应有值');
  } catch (e) {
    assert(false, 'evaluate 不应抛错（原恒抛 activeRules is not defined）: ' + e.message);
  }

  try {
    const dr = newDr();
    const r = dr.evaluate({ type: 'probe', data: {} }, 'probe', '帮我推理一下这个证据和事实', null);
    assert('matched' in r, '返回值应有 matched 字段');
    assert('rules' in r, '返回值应有 rules 字段');
    assert(Array.isArray(r.rules), 'rules 应为数组');
  } catch (e) {
    assert(false, 'evaluate 字段齐备检查不应抛错: ' + e.message);
  }

  {
    const dr = newDr();
    let threw = null;
    try { dr.evaluate({ type: 'probe', data: {} }, 'probe', '这个操作有风险会导致危险和伤害', null); }
    catch (e) { threw = e.message; }
    assert(!threw, 'evaluate 不应抛错: ' + threw);
    const s = dr._lastCedStrategy;
    assert(s && typeof s === 'object', 'CED 分支应被走进（_lastCedStrategy 非空，修复前恒 null）');
    assert(typeof s.activateRatio === 'number', 'activateRatio 应为数字');
    assert(!!s.mode, 'mode 应有值');
  }

  {
    const dr = newDr();
    let threw = null;
    try {
      dr.evaluate({ type: 'probe' }, 'probe', '', null);
      dr.evaluate({ type: 'probe' }, 'probe', null, null);
    } catch (e) { threw = e.message; }
    assert(!threw, '空输入/null 输入 evaluate 不应抛错: ' + threw);
    assert(Array.isArray(dr._activeRulesForEval) && dr._activeRulesForEval.length > 0,
      '_activeRulesForEval 应为非空数组');
    assert(dr._activeRulesForEval.length <= dr._rules.length, '过滤后规则数不应超过总数');
  }

  // ── ② SelfVerifier 接线（引擎真跑）────────────────────────────────
  try {
    const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));
    const hf = new HeartFlow();
    await hf.start();
    const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });

    const sv = r && r._selfVerification;
    assert(!!sv, 'result._selfVerification 应落地（修复前字段从不出现）');
    if (sv) {
      assert(typeof sv.passed === 'boolean', 'passed 应为布尔，实际=' + typeof sv.passed);
      assert(sv.checks && typeof sv.checks === 'object', 'checks 应为对象');
      assert(Array.isArray(sv.issues), 'issues 应为数组');
      assert(typeof sv.confidence === 'number' && sv.confidence >= 0 && sv.confidence <= 1,
        'confidence 应为 0-1 数字，实际=' + sv.confidence);
      for (const k of ['reverseConsistency', 'logicalChain', 'counterfactual', 'coverageCheck']) {
        assert(typeof sv.checks[k] === 'boolean', 'check.' + k + ' 应为布尔，实际=' + typeof sv.checks[k]);
      }
    }

    const errs = (hf._initErrors || []).filter(e => e.module === 'optional').map(e => String(e.error || ''));
    const rBugs = errs.filter(m => m.includes('reasoning.toLowerCase') || m.includes('activeRules'));
    assert(rBugs.length === 0, '不应再有这两条恒崩，实际=' + JSON.stringify(rBugs));

    const dr = hf._decisionRouter;
    let threw = null, out = null;
    try { out = dr.evaluate({ type: 'probe', data: {} }, 'probe', '这个操作有风险会导致危险', null); }
    catch (e) { threw = e.message; }
    assert(!threw, 'think() 后 decisionRouter.evaluate 不应抛错: ' + threw);
    assert(out && typeof out.matched === 'boolean', 'evaluate 应返回 matched 布尔');
  } catch (e) {
    assert(false, '引擎侧断言失败: ' + (e && e.message));
  }

  console.log(`测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => {
  console.error('FATAL:', e && e.message);
  process.exit(1);
});
