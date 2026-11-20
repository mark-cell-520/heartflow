/**
 * r418 接线固化：execution.verify 断链修复
 *
 * 背景（r417 探针实证 + 本测试固化）：
 *   ExecutionVerifier 模块（src/core/execution-verifier.js，570 行）早已实例化为
 *   this.execution（heartflow.js:1970），但从未被 dispatch：
 *     · _modules 无 'execution' 键 → dispatch 找不到子系统
 *     · ALLOWED_ROUTES 无 execution.* 路由 → dispatch 抛 route not allowed
 *     · MCP 工具 heartflow_execution_verify 的 TOOLS schema 缺 action/expected
 *       → 调用方参数被清洗丢弃，handler 报「action 是必填参数」
 *   三处全断 = 工具存在、引擎完整、实际零能力。
 *
 * 本测试逐项验证修复后的真实可达性与判别正确性：
 *   1. _modules['execution'] 注册 + 方法面完整
 *   2. ALLOWED_ROUTES 三条 execution.* 路由在册
 *   3. dispatch('execution.verify') 攻击矩阵（6 变体）正确判别
 *   4. dispatch('execution.getStats' / 'execution.getHistory') 可达且非空转
 *   5. MCP handler 参数适配（拆包形态等价复现）
 *   6. 白名单外路由仍然拒绝（接线不放宽安全边界）
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));

let passed = 0, failed = 0;
const failures = [];
function ok(cond, name, detail) {
  if (cond) { passed++; }
  else { failed++; failures.push(name + (detail ? ' — ' + detail : '')); }
}

async function main() {
  const hf = new HeartFlow();
  await new Promise((res) => {
    try { if (hf.start) hf.start(res); else res(); } catch (e) { res(); }
    setTimeout(res, 3000);
  });

  // ─── 1. 挂载注册 ───
  const sub = hf._modules['execution'];
  ok(!!sub, 'execution 子系统已注册进 _modules');
  const methods = sub ? Object.getOwnPropertyNames(Object.getPrototypeOf(sub)) : [];
  for (const m of ['verify', 'getHistory', 'getStats', 'recordVerification']) {
    ok(methods.includes(m), `ExecutionVerifier.${m} 方法存在`, methods.join(','));
  }

  // ─── 2. 白名单路由 ───
  const rs = HeartFlow.ALLOWED_ROUTES;
  const routeSet = rs instanceof Set ? rs : new Set(rs.snapshot ? rs.snapshot() : []);
  ok(routeSet.has('execution.verify'), 'ALLOWED_ROUTES 含 execution.verify');
  ok(routeSet.has('execution.getHistory'), 'ALLOWED_ROUTES 含 execution.getHistory');
  ok(routeSet.has('execution.getStats'), 'ALLOWED_ROUTES 含 execution.getStats');

  // ─── 3. 攻击矩阵：dispatch('execution.verify') 判别正确性 ───
  const cases = [
    {
      name: 'A 失败结果（success:false）→ failed',
      result: { success: false, output: 'build failed' },
      ctx: { plan: { actions: ['build'] }, expectedOutcome: 'build succeeds' },
      expect: (r) => r.status === 'failed' && r.passed === false,
    },
    {
      name: 'B 预期兑现（success:true + expected 全含）→ success',
      result: { success: true, output: 'run tests: all 16 tests passed' },
      ctx: { plan: { actions: ['run tests'] }, expectedOutcome: 'tests passed' },
      expect: (r) => r.status === 'success' && r.passed === true,
    },
    {
      name: 'C 动作不可追溯 → partial + no_action_trace',
      result: { success: true, output: 'done' },
      ctx: { plan: { actions: ['send email', 'notify slack'] }, expectedOutcome: '' },
      expect: (r) => r.status === 'partial' && r.issues.some(i => i.type === 'no_action_trace'),
    },
    {
      name: 'D 超时（duration_ms > timeout）→ timeout',
      result: { success: true, output: 'ok', duration_ms: 99000 },
      ctx: { plan: {}, expectedOutcome: '', timeout: 1000 },
      expect: (r) => r.status === 'timeout' && r.issues.some(i => i.type === 'execution_timeout'),
    },
    {
      name: 'E 预期缺失（expected 关键词不在 result）→ high issue',
      result: { success: true, output: 'nothing relevant here' },
      ctx: { plan: { actions: ['x'] }, expectedOutcome: 'deployment complete' },
      expect: (r) => r.issues.some(i => i.severity === 'high'),
    },
    {
      name: 'F 敏感副作用字段 → side_effect / high',
      result: { success: true, output: 'ok', apiKey: 'sk-xxx', authToken: 't' },
      ctx: { plan: { actions: ['x'] }, expectedOutcome: '' },
      expect: (r) => r.status === 'side_effect' || r.issues.some(i => i.type === 'sensitive_side_effect'),
    },
  ];
  for (const c of cases) {
    let r;
    try { r = hf.dispatch('execution.verify', c.result, c.ctx); }
    catch (e) { ok(false, c.name + '（dispatch 抛错）', e.message); continue; }
    ok(r && typeof r === 'object' && !r.error, c.name + '（返回结构合法）', JSON.stringify(r).slice(0, 120));
    ok(c.expect(r), c.name + '（判别正确）', 'status=' + r.status + ' issues=' + JSON.stringify((r.issues || []).map(i => i.type)));
  }

  // ─── 4. getStats / getHistory 可达 ───
  const stats = hf.dispatch('execution.getStats');
  ok(stats && !stats.error && typeof stats.total === 'number', 'execution.getStats 可达', JSON.stringify(stats).slice(0, 120));
  ok(stats.total >= 6, 'getStats 记录了本轮 6 次验证', 'total=' + (stats && stats.total));
  ok(stats.successRate >= 0 && stats.successRate <= 1, 'getStats.successRate 在 [0,1]', String(stats.successRate));
  const hist = hf.dispatch('execution.getHistory', 3);
  ok(Array.isArray(hist) && hist.length > 0, 'execution.getHistory 可达且非空', JSON.stringify(hist).slice(0, 120));

  // ─── 5. MCP handler 参数适配等价复现 ───
  function handlerReplica({ action, result, expected }) {
    if (!action) return { error: 'action 是必填参数' };
    const resultText = typeof result === 'string' ? result : (result == null ? '' : JSON.stringify(result));
    const resultObj = (result && typeof result === 'object' && !Array.isArray(result)) ? result : { output: resultText };
    return hf.dispatch('execution.verify', resultObj, { plan: { actions: [action] }, expectedOutcome: expected || '' });
  }
  const mcp = handlerReplica({ action: 'run tests', result: 'all 16 passed', expected: 'tests pass' });
  ok(mcp && !mcp.error && typeof mcp.score === 'number', 'MCP 适配后 dispatch 真实执行', JSON.stringify(mcp).slice(0, 150));
  const noAction = handlerReplica({ result: 'x' });
  ok(noAction && noAction.error, '缺 action 仍被 handler 拦截', JSON.stringify(noAction));

  // ─── 6. 安全边界：白名单外路由仍拒绝 ───
  let threw = false;
  try { hf.dispatch('execution.nonexistent', {}); } catch (e) { threw = /not allowed/.test(e.message); }
  ok(threw, '白名单外 execution.* 路由仍抛 not allowed（接线不放宽边界）');

  console.log(`\nr418 execution-wiring: ${passed} passed, ${failed} failed`);
  if (failures.length) { console.log('FAILURES:'); failures.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  process.exit(0);
}

main().catch(e => { console.error('TEST_ERROR', e); process.exit(1); });
