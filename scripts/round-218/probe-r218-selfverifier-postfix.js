// 第 218 轮探针 12：self-verifier 修复后是否落地 _selfVerification
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  let throws = 0, ok = 0;
  const orig = hf.verify.verify.bind(hf.verify);
  hf.verify.verify = (...a) => { try { const r = orig(...a); ok++; return r; } catch (e) { throws++; throw e; } };
  const out = {};
  for (const [name, input] of [['a', '帮我看看这个方案有没有什么问题'], ['b', '这家公司发布的新产品是真的吗']]) {
    const r = await hf.think(input, { compact: false });
    out[name] = {
      hasSV: !!r._selfVerification,
      passed: r._selfVerification ? r._selfVerification.passed : null,
      checks: r._selfVerification ? r._selfVerification.checks : null,
      issues: r._selfVerification ? r._selfVerification.issues : null,
      conf: r._selfVerification ? r._selfVerification.confidence : null,
    };
  }
  out.verifyCalls = ok; out.verifyThrows = throws;
  out.initErrs = (hf._initErrors || []).filter(e => e.module === 'optional').map(e => e.error).slice(0, 4);
  console.log('PROBE12:' + JSON.stringify(out));
})();
