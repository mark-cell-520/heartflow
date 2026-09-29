// 第 218 轮探针 3：确认修好 activeRules 后，CED 分支是否真的被走到
// （进不去 = 修了也没用；进得去 = 修了才有效）
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const dr = hf._decisionRouter;
  const out = { cedEnabled: !!dr._cedEnabled, hasCed: !!dr._ced, domainClassifier: !!dr._domainClassifier };
  // 直接调 evaluate 看异常
  const probe = async (input) => {
    try {
      const r = await dr.evaluate({ type: 'probe', data: {} }, 'probe', input, null);
      return { ok: true, matched: r && r.matched, decision: r && r.decision && r.decision.type, cedStrategy: dr._lastCedStrategy || null, domain: (dr._domainClassifier ? 'has' : 'none') };
    } catch (e) { return { ok: false, err: e.message, cedStrategy: dr._lastCedStrategy || null }; }
  };
  out.a = await probe('据报道这家公司发布了新产品，这是真的吗');
  out.b = await probe('帮我看看这个方案的伦理问题');
  out.c = await probe('');
  // 再看 _activeRulesForEval 是否被设置
  out.evalSet = Array.isArray(dr._activeRulesForEval) ? dr._activeRulesForEval.length : null;
  out.totalRules = Array.isArray(dr._rules) ? dr._rules.length : null;
  // wrapDispatchResult 是否也走 evaluate
  out.hasWrap = typeof dr.wrapDispatchResult === 'function';
  console.log('PROBE3:' + JSON.stringify(out));
})();
