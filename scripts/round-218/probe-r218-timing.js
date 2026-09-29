// 第 218 轮诊断 5：测试文件跑完只出 5 行汇总说明什么？
// 关键怀疑：CHILD_TIMEOUT=90000 秒是 execSync 的 timeout(ms)=90000 即 90 秒。
// 引擎 start() 实测要多久？>90s 就会被 SIGTERM 杀掉 → 只有同步段 5 行输出。
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));
(async () => {
  const t0 = Date.now();
  const hf = new HeartFlow();
  await hf.start();
  const t1 = Date.now();
  const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
  const t2 = Date.now();
  console.log('TIMING start=' + (t1 - t0) + 'ms think=' + (t2 - t1) + 'ms hasSV=' + !!r._selfVerification);
  process.exit(0);
})();
