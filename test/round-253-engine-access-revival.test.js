/**
 * round-253-engine-access-revival.test.js
 *
 * r253 轮测试：7 个「引擎访问模式错」的 MCP 工具 100% 崩修复轮
 *
 * 轮初实测（scripts/tmp-253-seven-tools-probe.js，require mcp-server →
 * initHeartFlow() → 逐个 tools/call，引擎已完整启动 162 模块仍全崩）：
 *   7 个已广告的 MCP 工具用「从不被赋值的引擎访问模式」取子系统，恒返回错误——
 *     ① heartflow_boundary_check  → 'boundaryGuard not loaded'
 *        第二形参 hf 实为 sessionId 字符串（tools/call 以 handler(args, sessionId)
 *        调用，mcp-server.js:5545），hf.boundaryGuard 恒 undefined
 *     ② heartflow_cache_stats     → 'cache_not_initialized'
 *        读 globalThis.heartflow（全 src 从未赋值）+ 引用的 _thinkCache 已在
 *        [AUDIT-FIX 2026-11-02] 作为死代码删除（heartflow.js:5904）
 *     ③ heartflow_decision_history→ 'heartflow_instance_not_found'
 *        读 globalThis.heartflow（从未赋值），真身是模块级 heartflow._decisionHistory
 *     ④~⑦ heartflow_error_store/query/fix/verify → 'error memory not ready'
 *        读 heartflow._hfCore（全 src 从未赋值），真身是 heartflow._modules.errorMemory
 *        （store/query）与 heartflow._modules.errorTaxonomy（fix/verify）
 *
 * 根因共性：这些 handler 用了与当前 MCP 框架（传 sessionId、引擎在模块级 heartflow）
 * 不一致的旧访问模式，而兄弟 handler（benchmark_run 用 getOrCreateInstance、
 * boundary 之外多数 handler 直接用模块级 heartflow）是对的。
 *
 * 本轮落地：7 个 handler 的引擎/子系统访问模式修正（src/mcp-server.js）。
 * cache_stats 按设计原则 #5 诚实记账——think-cache 确已删，改报真实存活的 kvCache。
 *
 * 运行：node test/round-253-engine-access-revival.test.js
 */

'use strict';

// [r249 坑①] mcp-server.js 加载会把 process.stdout.write 改道 stderr，进程内
// require 会让汇总行流到 stderr，run-all.js 只解析 stdout → 判失败。故 MCP
// 端到端断言放独立子进程里跑。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const HF = path.join(__dirname, '..');
const results = [];
const asyncTests = [];
function t(name, fn) {
  const p = (async () => fn())();
  if (p && typeof p.then === 'function') {
    asyncTests.push(p.then(
      () => { results.push({ name, ok: true }); console.log(`  ✅ ${name}`); },
      (e) => { results.push({ name, ok: false, err: e.message }); console.log(`  ❌ ${name}\n     ${e.message}`); }
    ));
    return;
  }
  try {
    fn();
    results.push({ name, ok: true }); console.log(`  ✅ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, err: e.message }); console.log(`  ❌ ${name}\n     ${e.message}`);
  }
}

// 完整启动的引擎实例（与 handler 用的模块级 heartflow 同类同初始化路径）
let hf = null;
try {
  const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  hf = new HeartFlow();
  hf.start();
} catch (e) {
  console.log('  ❌ 引擎启动失败:', e.message);
}

// [r252 坑] 子进程 require mcp-server 后 stdio-guard 把 console.log 改道 stderr，
// 用 spawnSync 拿 stdout+stderr 两份一起找 RESULT: 行。
function runChild(script) {
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, ['-e', script], {
    cwd: HF,
    encoding: 'utf8',
    env: Object.assign({}, process.env, { HEARTFLOW_MCP_TOKEN: 'round-253-probe-token' }),
  });
  const combined = `${r.stdout || ''}\n${r.stderr || ''}`;
  const line = combined.trim().split('\n').filter(l => l.startsWith('RESULT:')).pop();
  if (!line) throw new Error(`子进程未输出 RESULT 行。status=${r.status}\n${combined.slice(-800)}`);
  return JSON.parse(line.slice(7));
}

// ═══════════════════════════════════════════════
// A 族 — 修复目标子系统在完整引擎上确实存在 + bug 根源确实缺席
// ═══════════════════════════════════════════════

t('A1 完整引擎上 7 个 handler 现在指向的子系统全部存在且方法齐全', () => {
  assert.ok(hf, '引擎应启动成功');
  // boundary_check → engine.boundaryGuard.checkWrite
  assert.ok(hf.boundaryGuard && typeof hf.boundaryGuard.checkWrite === 'function', 'boundaryGuard.checkWrite 应存在');
  // error_store/query → _modules.errorMemory.store/query
  assert.ok(hf._modules && hf._modules.errorMemory, '_modules.errorMemory 应存在');
  assert.strictEqual(typeof hf._modules.errorMemory.store, 'function', 'errorMemory.store 应存在');
  assert.strictEqual(typeof hf._modules.errorMemory.query, 'function', 'errorMemory.query 应存在');
  // error_fix/verify → _modules.errorTaxonomy.fix/verify（errorMemory 本体没有这两个）
  assert.ok(hf._modules && hf._modules.errorTaxonomy, '_modules.errorTaxonomy 应存在');
  assert.strictEqual(typeof hf._modules.errorTaxonomy.fix, 'function', 'errorTaxonomy.fix 应存在');
  assert.strictEqual(typeof hf._modules.errorTaxonomy.verify, 'function', 'errorTaxonomy.verify 应存在');
  // decision_history → _decisionHistory
  assert.ok(Array.isArray(hf._decisionHistory), '_decisionHistory 应为数组');
  // cache_stats → kvCache._stats
  assert.ok(hf.kvCache && hf.kvCache._stats, 'kvCache._stats 应存在');
  assert.strictEqual(typeof hf.kvCache._stats.hits, 'number', 'kvCache._stats.hits 应为数字');
});

t('A2 bug 根源三个访问模式在完整引擎上确实恒为空（证明旧代码为何 100% 崩）', () => {
  assert.ok(hf, '引擎应启动成功');
  assert.strictEqual(hf._hfCore, undefined, '_hfCore 应从未被赋值');
  assert.strictEqual(hf._thinkCache, undefined, '_thinkCache 应已被删除');
  assert.strictEqual(globalThis.heartflow, undefined, 'globalThis.heartflow 应从未被赋值');
  // errorMemory 本体确无 fix/verify（证明 fix/verify 必须指 errorTaxonomy）
  assert.strictEqual(typeof (hf._modules.errorMemory && hf._modules.errorMemory.fix), 'undefined', 'errorMemory 不应有 fix');
  assert.strictEqual(typeof (hf._modules.errorMemory && hf._modules.errorMemory.verify), 'undefined', 'errorMemory 不应有 verify');
});

// ═══════════════════════════════════════════════
// B 族 — 源码级：handler 不再引用坏模式、改引正确目标
// ═══════════════════════════════════════════════

t('B1 源码可执行代码不再引用三个坏访问模式（_hfCore / globalThis.heartflow / _thinkCache）', () => {
  const raw = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  // 剥离注释后再匹配——本轮修复注释里刻意保留了旧模式字样（可审计「旧代码为何坏」），
  // 但可执行代码里不允许再出现。块注释 + 行注释都剥。
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  assert.ok(!/heartflow\._hfCore/.test(code), '可执行代码不应再出现 heartflow._hfCore（全 src 从未赋值）');
  assert.ok(!/globalThis\.heartflow/.test(code), '可执行代码不应再出现 globalThis.heartflow（全 src 从未赋值）');
  assert.ok(!/hf\._thinkCache/.test(code), '可执行代码不应再出现 hf._thinkCache（已删死代码）');
});

t('B2 boundary_check 形参不再把 sessionId 当引擎；四个 error handler 指向正确子系统', () => {
  const src = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  // boundary_check 签名从 (args, hf) 改为 (args)
  assert.ok(/heartflow_boundary_check:\s*\(args\)\s*=>/.test(src), 'boundary_check 应改为 (args)，不再接 sessionId 当引擎');
  assert.ok(/engine\.boundaryGuard/.test(src), 'boundary_check 应读 engine.boundaryGuard');
  // error store/query 指 _modules.errorMemory
  assert.ok(/em\.store\(problem, action, outcome\)/.test(src), 'error_store 应调 em.store');
  assert.ok(/em\.query\(problem, limit/.test(src), 'error_query 应调 em.query');
  // error fix/verify 指 _modules.errorTaxonomy
  assert.ok(/tax\.fix\(id, note/.test(src), 'error_fix 应调 tax.fix');
  assert.ok(/tax\.verify\(id, note/.test(src), 'error_verify 应调 tax.verify');
  // decision/cache 用模块级 heartflow
  assert.ok(/const hf = heartflow \|\| null;/.test(src), 'decision/cache 应读模块级 heartflow');
});

// ═══════════════════════════════════════════════
// C 族 — 7 个工具在 HANDLERS + tools-registry 两处都在册
// ═══════════════════════════════════════════════

t('C1 7 个工具在 HANDLERS 映射与工具注册表都在册', () => {
  const src = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  for (const n of ['heartflow_boundary_check', 'heartflow_cache_stats', 'heartflow_decision_history',
                   'heartflow_error_store', 'heartflow_error_query', 'heartflow_error_fix', 'heartflow_error_verify']) {
    assert.ok(new RegExp(`${n}:`).test(src), `HANDLERS 缺 ${n} 映射`);
  }
  const registry = require(path.join(HF, 'src/mcp/tools-registry.js'));
  const extended = require(path.join(HF, 'src/mcp/extended-tools.js'));
  const all = (registry.TOOLS || registry).concat(extended._EXTENDED || extended.TOOLS || extended);
  const names = all.map(x => x && x.name).filter(Boolean);
  for (const n of ['heartflow_boundary_check', 'heartflow_cache_stats', 'heartflow_decision_history',
                   'heartflow_error_store', 'heartflow_error_query', 'heartflow_error_fix', 'heartflow_error_verify']) {
    assert.ok(names.includes(n), `工具定义缺 ${n}`);
  }
});

// ═══════════════════════════════════════════════
// D 族 — 独立子进程端到端：7 个工具从 100% 崩到真实输出
// ═══════════════════════════════════════════════

t('D1 独立子进程端到端：7 个工具全部返回真实输出，无一个再报旧错误', () => {
  const script = `
const path = require('path');
const HF = ${JSON.stringify(HF)};
const { handleRequest, initHeartFlow } = require(path.join(HF, 'src/mcp-server.js'));
initHeartFlow();
(async () => {
  await new Promise(r => setTimeout(r, 300));
  const out = {};
  const call = async (name, args) => {
    const r = await handleRequest({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }, null, { __stdio: true });
    return JSON.parse(r.content[0].text);
  };
  const OLD = ['boundaryGuard not loaded','cache_not_initialized','heartflow_instance_not_found','error memory not ready','error taxonomy not ready'];
  const bad = (o) => (o && typeof o === 'object' && OLD.includes(o.error)) ? o.error : null;
  const bc = await call('heartflow_boundary_check', { filePath: 'src/gate.js', actor: 'probe', purpose: 'check' });
  out.bcErr = bad(bc); out.bcVerdict = bc.verdict || null; out.bcPath = bc.resolvedPath ? true : false;
  const cs = await call('heartflow_cache_stats', {});
  out.csErr = bad(cs); out.csRemoved = cs.thinkCache ? cs.thinkCache.removed : null; out.csKv = cs.kvCache ? typeof cs.kvCache.hits : null;
  const dh = await call('heartflow_decision_history', { limit: 5 });
  out.dhErr = bad(dh); out.dhIsArr = Array.isArray(dh.history); out.dhTotal = typeof (dh.stats && dh.stats.total);
  const eq = await call('heartflow_error_query', { problem: 'overconfidence' });
  out.eqErr = bad(eq); out.eqIsArr = Array.isArray(eq.results); out.eqTotal = typeof eq.total;
  const es = await call('heartflow_error_store', { problem: 'overconfidence', action: 'r253-probe-action', outcome: 'r253-probe-outcome' });
  out.esErr = bad(es); out.esStored = es.stored;
  const ef = await call('heartflow_error_fix', { id: 1, note: 'r253-probe' });
  out.efErr = bad(ef); out.efHasId = ('id' in ef);
  const ev = await call('heartflow_error_verify', { id: 1, note: 'r253-probe' });
  out.evErr = bad(ev); out.evHasId = ('id' in ev);
  console.log('RESULT:' + JSON.stringify(out));
})().catch(e => { console.log('RESULT:' + JSON.stringify({ fatal: e.message })); });
`;
  const r = runChild(script);
  assert.ok(!r.fatal, `子进程不应崩: ${r.fatal}`);
  // 无一个再报旧错误
  for (const k of ['bcErr', 'csErr', 'dhErr', 'eqErr', 'esErr', 'efErr', 'evErr']) {
    assert.strictEqual(r[k], null, `${k} 不应再报旧错误: ${r[k]}`);
  }
  // 各自返回真实形状
  assert.ok(typeof r.bcVerdict === 'string' && r.bcVerdict.length > 0, 'boundary_check 应返回真实 verdict');
  assert.strictEqual(r.bcPath, true, 'boundary_check 应返回 resolvedPath');
  assert.strictEqual(r.csRemoved, true, 'cache_stats 应诚实标注 thinkCache.removed');
  assert.strictEqual(r.csKv, 'number', 'cache_stats 应返回真实 kvCache 统计');
  assert.strictEqual(r.dhIsArr, true, 'decision_history 应返回 history 数组');
  assert.strictEqual(r.dhTotal, 'number', 'decision_history 应返回 stats.total 数字');
  assert.strictEqual(r.eqIsArr, true, 'error_query 应返回 results 数组');
  assert.strictEqual(r.eqTotal, 'number', 'error_query 应返回 total 数字');
  assert.strictEqual(r.esStored, true, 'error_store 应真实写入 stored=true');
  assert.strictEqual(r.efHasId, true, 'error_fix 应返回带 id 的真实结果');
  assert.strictEqual(r.evHasId, true, 'error_verify 应返回带 id 的真实结果');
});

// ═══════════════════════════════════════════════
// E 族 — 回归：引擎干净启动 + 判别引擎零改动 + 兄弟工具不受影响
// ═══════════════════════════════════════════════

t('E1 引擎干净启动：模块 162 不变、_initErrors 零新增', () => {
  assert.ok(hf, '引擎应启动成功');
  assert.deepStrictEqual(hf._initErrors || [], [], '_initErrors 应为空');
  assert.strictEqual(Object.keys(hf._modules || {}).length, 162, `_modules 应 162，实际 ${Object.keys(hf._modules || {}).length}`);
});

t('E2 判别维度 210 不变（本轮只改 mcp-server.js，未动判别引擎）', () => {
  const idx = require(path.join(HF, 'src/index.js'));
  const d = idx.discriminate('测试句子');
  const keys = Object.keys(d.dimensions || {});
  assert.strictEqual(keys.length, 210, `维度应 210，实际 ${keys.length}`);
});

t('E3 三个招牌入口行为不变（gate 未受影响）', () => {
  const gate = require(path.join(HF, 'src/gate.js'));
  const atk = gate.checkOutput('毫无疑问这是唯一正确的解决方案，所有人都必须服从。');
  assert.ok(atk && atk.gate && typeof atk.gate.action === 'string', 'checkOutput 应返回 gate.action');
  assert.ok(atk.gate.action !== 'pass', '攻击句不应判 pass');
  const benign = gate.checkOutput('今天天气不错，适合出去散步。');
  assert.strictEqual(benign.gate.action, 'pass', '良性句应判 pass');
});

// ═══════════════════════════════════════════════
// F 族 — HandlerWiringChecker：把「handler 探不到子系统」固化成常驻自检
// ═══════════════════════════════════════════════

t('F1 完整引擎上 8 条子系统依赖全部可达 → healthy=true', () => {
  const { HandlerWiringChecker } = require(path.join(HF, 'src/mcp/handler-wiring-check.js'));
  assert.strictEqual(typeof HandlerWiringChecker, 'function', '应导出 HandlerWiringChecker');
  const r = new HandlerWiringChecker(hf).check();
  assert.strictEqual(r.engineReady, true, '引擎应就绪');
  assert.strictEqual(r.total, 8, `应登记 8 条，实际 ${r.total}`);
  assert.strictEqual(r.reachable, 8, `8 条应全部可达，unreachable=${JSON.stringify(r.unreachable)}`);
  assert.strictEqual(r.healthy, true, 'healthy 应为 true');
  assert.ok(/仅覆盖/.test(r.note || ''), 'note 应写清覆盖范围，不假装覆盖全部工具');
});

t('F2 能测出坏接线：子系统缺失/方法不齐 → 该条进 unreachable 且 healthy=false', () => {
  const { HandlerWiringChecker } = require(path.join(HF, 'src/mcp/handler-wiring-check.js'));
  // 造一个缺 boundaryGuard、errorTaxonomy 只有 fix 没 verify 的残引擎
  const broken = {
    boundaryGuard: undefined,
    kvCache: { _stats: { hits: 'not-a-number' } },
    _decisionHistory: [],
    _modules: {
      errorMemory: { store: () => {}, query: () => {} },
      errorTaxonomy: { fix: () => {}, classify: () => {} }, // 缺 verify
    },
  };
  const r = new HandlerWiringChecker(broken).check();
  assert.strictEqual(r.healthy, false, '有坏接线时 healthy 应为 false');
  const badTools = r.unreachable.map(u => u.tool);
  assert.ok(badTools.includes('heartflow_boundary_check'), 'boundaryGuard 缺失应被测出');
  assert.ok(badTools.includes('heartflow_error_verify'), 'errorTaxonomy 缺 verify 应被测出');
  assert.ok(badTools.includes('heartflow_cache_stats'), 'kvCache._stats.hits 非数字应被测出');
  for (const u of r.unreachable) assert.ok(typeof u.reason === 'string' && u.reason.length > 0, '每条不可达都要有 reason');
});

t('F3 探针抛错不炸自检：判不可达并记 probe_threw', () => {
  const { HandlerWiringChecker } = require(path.join(HF, 'src/mcp/handler-wiring-check.js'));
  const landmine = { get boundaryGuard() { throw new Error('getter 炸'); }, _modules: {}, kvCache: { _stats: { hits: 0 } }, _decisionHistory: [] };
  const r = new HandlerWiringChecker(landmine).check();
  assert.strictEqual(r.engineReady, true);
  const bc = r.unreachable.find(u => u.tool === 'heartflow_boundary_check');
  assert.ok(bc && /probe_threw/.test(bc.reason), '抛错的探针应记 probe_threw');
});

t('F4 引擎未就绪时如实报 engine_not_ready，不编数字', () => {
  const { HandlerWiringChecker } = require(path.join(HF, 'src/mcp/handler-wiring-check.js'));
  const r = new HandlerWiringChecker(null).check();
  assert.strictEqual(r.engineReady, false);
  assert.strictEqual(r.reason, 'engine_not_ready');
  assert.strictEqual(r.total, 0, '引擎没就绪不应假报 total');
  assert.strictEqual(r.healthy, false);
});

t('F5 handleModuleHealth 以加法字段暴露 handlerWiring，summary 既有形状不变', () => {
  const src = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  assert.ok(/handlerWiring/.test(src), 'handleModuleHealth 应返回 handlerWiring 字段');
  assert.ok(/new HandlerWiringChecker\(heartflow\)\.check\(\)/.test(src), '应用活引擎实例跑 wiring 自检');
  // summary 仍来自 ModuleHealthChecker.getSummary()（r251 断言依赖其形状）
  assert.ok(/const summary = checker\.getSummary\(\);/.test(src), 'summary 仍由 ModuleHealthChecker 产出');
});

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════
(async () => {
  if (asyncTests.length) await Promise.all(asyncTests);
  const pass = results.filter(r => r.ok).length;
  const fail = results.length - pass;
  console.log(`round-253 引擎访问模式复活：${pass} 通过, ${fail} 失败（共 ${results.length}）`);
  if (fail > 0) {
    for (const r of results.filter(x => !x.ok)) console.log(`   失败: ${r.name} — ${r.err}`);
    process.exit(1);
  }
  process.exit(0);
})();
