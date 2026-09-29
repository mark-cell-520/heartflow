// 第 218 轮探针 9：修复后 evaluate 的正常路径（含 CED 分支真的被走进）
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const dr = hf._decisionRouter;
  const out = {};
  const probe = async (name, input, result) => {
    try {
      const r = await dr.evaluate(result || { type: 'probe', data: {} }, 'probe', input, null);
      out[name] = {
        ok: true, matched: r.matched, decision: r.decision && r.decision.type,
        cedStrategy: dr._lastCedStrategy || null,
        cedComplexity: dr._lastComplexity != null ? dr._lastComplexity : null,
        evalLen: Array.isArray(dr._activeRulesForEval) ? dr._activeRulesForEval.length : null,
      };
    } catch (e) { out[name] = { ok: false, err: e.message }; }
  };
  await probe('safety-domain', '这个操作有风险会导致系统危险和伤害用户');
  await probe('emotion-domain', '我很难过，情绪低落，感到焦虑');
  await probe('cognition-domain', '帮我推理一下这个证据和事实');
  await probe('plain', '你好');
  await probe('empty', '');
  console.log('PROBE9:' + JSON.stringify(out));
})();
