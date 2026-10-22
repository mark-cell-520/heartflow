// 第 218 轮探针 1：确认 decision-router 的 activeRules 未定义 bug 复现条件
// 复现方式：直接实例化 DecisionRouter 并调 evaluate（不经过完整引擎）
const path = require('path');
const p = path.join(process.cwd(), 'src/core/decision-router.js');
const { DecisionRouter } = require(p);

(async () => {
  const results = [];
  const probe = async (name, input) => {
    try {
      const r = new DecisionRouter();
      // 什么都不跑，只触发 evaluate
      const out = await r.evaluate({ type: 'test', data: {} }, 'probe', input, null);
      results.push({ name, ok: true, matched: out && out.matched, decision: out && out.decision && out.decision.type });
    } catch (e) {
      results.push({ name, ok: false, err: e.message });
    }
  };
  // 需要 domainCtx.primary 命中才会进 CED 分支
  await probe('plain-zh', '帮我分析一下这个新闻的伦理问题');
  await probe('news-ish', '据报道某公司发布了新产品，这是真的吗');
  await probe('empty', '');
  console.log('PROBE1:' + JSON.stringify(results));
})();
