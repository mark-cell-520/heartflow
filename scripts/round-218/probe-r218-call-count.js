// 第 218 轮探针 4：evaluate 在完整 think() 链路里是否被调过（用插件式计数器）
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const dr = hf._decisionRouter;
  let calls = 0, errs = 0, lastErr = null;
  const orig = dr.evaluate.bind(dr);
  dr.evaluate = async function (...args) {
    calls++;
    try { return await orig(...args); }
    catch (e) { errs++; if (!lastErr) lastErr = e.message; throw e; }
  };
  const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
  console.log('PROBE4:' + JSON.stringify({
    evaluateCalls: calls,
    evaluateErrors: errs,
    lastErr,
    route: r && (r.route || r.type),
    initErrs: (hf._initErrors || []).filter(e => e.module === 'optional').map(e => e.error).slice(0, 4),
  }));
})();
