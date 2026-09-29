// 第 218 轮诊断 24：事件循环空了 —— require HeartFlow 是同步的，若引擎里某处
// process.exit 会在 exit 事件里留 code。既然没有 beforeExit 之外的信号，
// 唯一解释：IIFE 根本没进入。用 hook 在 require HeartFlow 时打点。
const fs = require('fs');
const path = require('path');
const TRACE = path.join(process.cwd(), '_dbg7.trace');
try { fs.unlinkSync(TRACE); } catch {}
const T = (s) => fs.appendFileSync(TRACE, s + '\n');
// 复刻：同步 5 用例 → require HeartFlow → new → IIFE
const assert = require('assert');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));
T('AFTER_DR');
(() => {
  const cases = 5;
  for (let i = 0; i < cases; i++) {
    const dr = new DecisionRouter({}, { modelProfile: 'flash' });
    dr.evaluate({ type: 'probe', data: {} }, 'probe', '这个操作有风险会导致危险和伤害', null);
    T('CASE_' + i);
  }
})();
T('BEFORE_REQUIRE_HF');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));
T('AFTER_REQUIRE_HF');
const hf = new HeartFlow();
T('AFTER_NEW');
console.log('  ✓ fake-sync-5');
(async () => {
  T('IIFE_IN');
  await hf.start();
  T('STARTED');
  const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
  T('THOUGHT ' + !!r._selfVerification);
  process.exit(0);
})();
