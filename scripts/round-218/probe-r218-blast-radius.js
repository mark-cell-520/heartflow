// 第 218 轮探针 7：量化两条崩的影响面（给 decision 补判据用）
// A 面：decisionRouter.evaluate 崩 → wrapDispatchResult 是否也崩？MCP 侧是否崩？
// B 面：self-verifier.verify 崩 → 一次 think() 内几次？
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const dr = hf._decisionRouter;
  const sv = hf.verify;
  const stat = { evaluateThrows: 0, evaluateOk: 0, wrapThrows: 0, wrapOk: 0, verifyThrows: 0, verifyOk: 0 };

  const oEval = dr.evaluate.bind(dr);
  dr.evaluate = async (...a) => { try { const r = await oEval(...a); stat.evaluateOk++; return r; } catch (e) { stat.evaluateThrows++; throw e; } };
  const oWrap = dr.wrapDispatchResult.bind(dr);
  dr.wrapDispatchResult = (...a) => { try { const r = oWrap(...a); stat.wrapOk++; return r; } catch (e) { stat.wrapThrows++; throw e; } };
  const oVerify = sv.verify.bind(sv);
  sv.verify = (...a) => { try { const r = oVerify(...a); stat.verifyOk++; return r; } catch (e) { stat.verifyThrows++; throw e; } };

  await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
  await hf.think('这家公司发布的新产品是真的吗', { compact: false });
  console.log('PROBE7:' + JSON.stringify(stat));
  // 现有测试是否覆盖这两条路径（决定修完能否被验证）
  const fs = require('fs');
  const testDir = path.join(process.cwd(), 'test');
  const hits = { evaluate: [], selfVerif: [] };
  for (const f of fs.readdirSync(testDir)) {
    if (!f.endsWith('.js')) continue;
    const t = fs.readFileSync(path.join(testDir, f), 'utf8');
    if (/wrapDispatchResult|decisionRouter\.evaluate|\.evaluate\(/.test(t)) hits.evaluate.push(f);
    if (/verify\.verify|_selfVerification|selfVerifier/i.test(t)) hits.selfVerif.push(f);
  }
  console.log('PROBE7-TESTS:' + JSON.stringify(hits));
})();
