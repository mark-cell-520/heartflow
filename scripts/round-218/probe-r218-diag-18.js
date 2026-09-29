// 第 218 轮诊断 18（终）：直接在同一进程里 require HeartFlow + start + think，
// 并对比「有 5 个同步 ok()」「没有同步 ok()」两种情况下 trace 的差异。
const fs = require('fs');
const path = require('path');
const TRACE = path.join(process.cwd(), '_dbg2.trace');
try { fs.unlinkSync(TRACE); } catch {}
const T = (s) => fs.appendFileSync(TRACE, s + '\n');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));
T('AFTER_REQUIRE_DR');
// 模拟测试文件的 5 个同步用例
for (let i = 0; i < 5; i++) {
  const dr = new DecisionRouter({}, { modelProfile: 'flash' });
  dr.evaluate({ type: 'probe', data: {} }, 'probe', '这个操作有风险会导致危险和伤害', null);
  T('SYNC_CASE_' + i);
}
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));
T('AFTER_REQUIRE_HF');
const hf = new HeartFlow();
T('AFTER_NEW');
(async () => {
  T('IIFE_ENTER');
  await hf.start();
  T('POST_START');
  const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
  T('POST_THINK hasSV=' + !!r._selfVerification);
  process.exit(0);
})();
