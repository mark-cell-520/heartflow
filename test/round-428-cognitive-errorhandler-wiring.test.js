// [r428] cognitiveProtocol + errorHandler 双模块接线固化测试
// 防回归：CognitiveProtocol（src/core/cognitive-protocol.js，1515 行）与
// ErrorHandler（src/core/error-handler.js，1493 行）的实例多年一直活着
// （heartflow.js L1519 `this.cognitive = new CognitiveProtocol(...)` 与
// `this.error = _ErrorHandler()`），但从未注册进 _modules →
// generateAllowedRoutes 扫不到 → routes() 零命中、dispatch('*.*') 全抛
// 'route not allowed'、MCP 侧无工具入口。本测试锁死「挂载 + 路由生成 +
// dispatch 可达 + 方法真实承重（非恒真空实现）」四层。
//
// 与 r423/r424 同形态同区块同时序（causalInference / selfVerifier）。
const test = require('node:test');
const assert = require('node:assert');
const { HeartFlow } = require('../src/core/heartflow.js');

async function freshHf() {
  const hf = new HeartFlow({ silent: true });
  await hf.start();
  return hf;
}

// ─── 一、挂载层 ───────────────────────────────────────────

test('r428 接线：cognitiveProtocol 实例非 null 且已挂载 _modules', async () => {
  const hf = await freshHf();
  assert.notStrictEqual(hf.cognitive, null, '原 this.cognitive 实例不得为 null');
  assert.notStrictEqual(hf.cognitiveProtocol, null, 'cognitiveProtocol 不得为 null');
  assert.ok(hf._modules.cognitiveProtocol, 'cognitiveProtocol 必须注册进 _modules');
  assert.strictEqual(hf._modules.cognitiveProtocol, hf.cognitive, '注册的必须是同一实例');
});

test('r428 接线：errorHandler 实例非 null 且已挂载 _modules', async () => {
  const hf = await freshHf();
  assert.notStrictEqual(hf.error, null, '原 this.error 实例不得为 null');
  assert.notStrictEqual(hf.errorHandler, null, 'errorHandler 不得为 null');
  assert.ok(hf._modules.errorHandler, 'errorHandler 必须注册进 _modules');
  assert.strictEqual(hf._modules.errorHandler, hf.error, '注册的必须是同一实例');
});

// ─── 二、路由生成层 ───────────────────────────────────────

test('r428 接线：cognitiveProtocol 19 条公开路由全部自动生成', async () => {
  const hf = await freshHf();
  const table = hf.routes();
  const registered = (table['cognitiveProtocol'] || []).filter(r => !r.includes('[未注册'));
  const expected = [
    'cognitiveProtocol.getStartupContext', 'cognitiveProtocol.printStartupContext',
    'cognitiveProtocol.analyzeTaskLevel', 'cognitiveProtocol.understand',
    'cognitiveProtocol.createCheckpoint', 'cognitiveProtocol.shouldSummarize',
    'cognitiveProtocol.getCheckpointHistory', 'cognitiveProtocol.completeCheckpoint',
    'cognitiveProtocol.addProblem', 'cognitiveProtocol.getPrioritizedProblems',
    'cognitiveProtocol.detectProblemPatterns', 'cognitiveProtocol.resolveProblem',
    'cognitiveProtocol.getUnresolvedProblems', 'cognitiveProtocol.searchProblems',
    'cognitiveProtocol.pauseTask', 'cognitiveProtocol.continueTask',
    'cognitiveProtocol.getPausedTasks', 'cognitiveProtocol.getStatus', 'cognitiveProtocol.stats'
  ];
  const missing = expected.filter(r => !registered.includes(r));
  assert.deepStrictEqual(missing, [], `缺失路由: ${missing.join(', ')}`);
  assert.strictEqual(registered.length, 19, `19 条路由应全部可注册，实际 ${registered.length}`);
});

test('r428 接线：errorHandler 8 条公开路由全部自动生成', async () => {
  const hf = await freshHf();
  const table = hf.routes();
  const registered = (table['errorHandler'] || []).filter(r => !r.includes('[未注册'));
  const expected = [
    'errorHandler.capture', 'errorHandler.getRecoverySuggestion',
    'errorHandler.classifyError', 'errorHandler.logError',
    'errorHandler.getHistory', 'errorHandler.getStats',
    'errorHandler.getHealthReport', 'errorHandler.resetAll'
  ];
  const missing = expected.filter(r => !registered.includes(r));
  assert.deepStrictEqual(missing, [], `缺失路由: ${missing.join(', ')}`);
  assert.strictEqual(registered.length, 8, `8 条路由应全部可注册，实际 ${registered.length}`);
});

// ─── 三、dispatch 可达层 ──────────────────────────────────

test('r428 接线：dispatch 可达（不再抛 route not allowed）', async () => {
  const hf = await freshHf();
  const cpStatus = await hf.dispatch('cognitiveProtocol.getStatus');
  assert.ok(cpStatus && typeof cpStatus === 'object', 'cognitiveProtocol.getStatus 应返回对象');
  assert.ok(!cpStatus.error, `不应返回 error: ${cpStatus && cpStatus.error}`);
  const ehStats = await hf.dispatch('errorHandler.getStats');
  assert.ok(ehStats && typeof ehStats === 'object', 'errorHandler.getStats 应返回对象');
  assert.ok(!ehStats.error, `不应返回 error: ${ehStats && ehStats.error}`);
});

// ─── 四、能力真实承重层（防恒真空实现） ───────────────────

test('r428 承重：analyzeTaskLevel 对不同复杂度任务给出不同分级', async () => {
  const hf = await freshHf();
  // 同族变体矩阵：简单任务 vs 多步骤复杂任务，分级结果必须可区分
  const simple = await hf.dispatch('cognitiveProtocol.analyzeTaskLevel', '改一个错别字');
  const complex = await hf.dispatch(
    'cognitiveProtocol.analyzeTaskLevel',
    '重构整个身份核心：先读源码定位所有耦合点，再拆出接口层，逐模块迁移并补测试，最后跑全量回归'
  );
  assert.ok(simple && !simple.error, `简单任务应可分级: ${JSON.stringify(simple)}`);
  assert.ok(complex && !complex.error, `复杂任务应可分级: ${JSON.stringify(complex)}`);
  const sKey = simple.level || simple.complexity || JSON.stringify(simple);
  const cKey = complex.level || complex.complexity || JSON.stringify(complex);
  assert.notStrictEqual(sKey, cKey,
    `不同复杂度任务必须得到不同分级（simple=${sKey} complex=${cKey}）`);
});

test('r428 承重：understand 对任务返回结构化理解（非空/非恒值）', async () => {
  const hf = await freshHf();
  const r = await hf.dispatch('cognitiveProtocol.understand', '给心虫新增一个逻辑谬误判别维度');
  assert.ok(r && !r.error, `understand 应可执行: ${JSON.stringify(r)}`);
  const s = JSON.stringify(r);
  assert.ok(s.length > 20, '返回不得是空壳');
  assert.ok(!/^(null|undefined|\{\})$/.test(s.trim()), '返回不得恒为 null/空对象');
});

test('r428 承重：createCheckpoint → getCheckpointHistory → completeCheckpoint 闭环', async () => {
  const hf = await freshHf();
  const cp = await hf.dispatch('cognitiveProtocol.createCheckpoint', 'r428 接线固化');
  assert.ok(cp && !cp.error, `createCheckpoint 应成功: ${JSON.stringify(cp)}`);
  const hist = await hf.dispatch('cognitiveProtocol.getCheckpointHistory');
  assert.ok(hist && !hist.error, `getCheckpointHistory 应成功: ${JSON.stringify(hist)}`);
  const list = Array.isArray(hist) ? hist : (hist.checkpoints || []);
  assert.ok(list.length >= 1, '刚建的检查点必须出现在历史里');
});

test('r428 承重：addProblem → getUnresolvedProblems → detectProblemPatterns 闭环', async () => {
  const hf = await freshHf();
  const a = await hf.dispatch('cognitiveProtocol.addProblem', '测试问题：路由零命中', '模块未注册进 _modules');
  assert.ok(a && !a.error, `addProblem 应成功: ${JSON.stringify(a)}`);
  const b = await hf.dispatch('cognitiveProtocol.addProblem', '测试问题：路由零命中', '模块未注册进 _modules');
  assert.ok(b && !b.error, '第二次 addProblem 应成功');
  const pat = await hf.dispatch('cognitiveProtocol.detectProblemPatterns');
  assert.ok(pat && !pat.error, `detectProblemPatterns 应成功: ${JSON.stringify(pat)}`);
});

test('r428 承重：pauseTask → getPausedTasks → continueTask 闭环', async () => {
  const hf = await freshHf();
  const p = await hf.dispatch('cognitiveProtocol.pauseTask', '卡在 MCP 工具注册', '补齐 tools-registry');
  assert.ok(p && !p.error, `pauseTask 应成功: ${JSON.stringify(p)}`);
  const pt = await hf.dispatch('cognitiveProtocol.getPausedTasks');
  assert.ok(pt && !pt.error, `getPausedTasks 应成功: ${JSON.stringify(pt)}`);
  const c = await hf.dispatch('cognitiveProtocol.continueTask');
  assert.ok(c && !c.error, `continueTask 应成功: ${JSON.stringify(c)}`);
});

test('r428 承重：classifyError 对不同错误给出不同类型（非恒值）', async () => {
  const hf = await freshHf();
  // 同族变体矩阵：三种语义不同的错误消息，分类必须可区分
  // 注意 classifyError 签名是 (Error)，读 error.message —— 传字符串会恒 unknown
  const net = await hf.dispatch('errorHandler.classifyError', new Error('ECONNREFUSED: connect ECONNREFUSED 127.0.0.1:8588'));
  const mem = await hf.dispatch('errorHandler.classifyError', new Error('JavaScript heap out of memory'));
  const syn = await hf.dispatch('errorHandler.classifyError', new Error('SyntaxError: Unexpected token } in JSON at position 42'));
  const types = [net, mem, syn];
  for (const t of types) {
    assert.ok(t !== undefined, '分类结果不得为 undefined');
  }
  assert.strictEqual(net, 'network', `ECONNREFUSED 应判 network，实际 ${net}`);
  assert.strictEqual(mem, 'memory', `heap out of memory 应判 memory，实际 ${mem}`);
  // 源码判定顺序：syntax 分支先于 json 分支（L1215-1225），
  // 故含 "SyntaxError"/"syntax" 的消息即使带 JSON 也判 syntax —— 锁定真实行为
  assert.strictEqual(syn, 'syntax', `SyntaxError 应判 syntax（源码 syntax 分支先于 json），实际 ${syn}`);
  const jsonOnly = await hf.dispatch('errorHandler.classifyError', new Error('Unexpected token } in JSON at position 42'));
  assert.strictEqual(jsonOnly, 'json', `不含 syntax 关键词的 JSON 错误应判 json，实际 ${jsonOnly}`);
  // 同族变体（同类型不同措辞）必须同型
  const netVariant = await hf.dispatch('errorHandler.classifyError', new Error('connection reset by peer'));
  assert.strictEqual(netVariant, 'network', `connection reset 应同样判 network，实际 ${netVariant}`);
});

test('r428 承重：isRetryable 对瞬时错误与永久错误可区分', async () => {
  const hf = await freshHf();
  // isRetryable 在 _retry 子模块上（顶层 errorHandler 只暴露 capture/classify 等 8 条）
  const retry = hf.errorHandler._retry;
  assert.ok(retry && typeof retry.isRetryable === 'function', 'errorHandler._retry.isRetryable 应存在');
  assert.strictEqual(retry.isRetryable('timeout'), true, 'timeout 应可重试');
  assert.strictEqual(retry.isRetryable('network'), true, 'network 应可重试');
  assert.strictEqual(retry.isRetryable('syntax'), false, 'syntax 不应重试');
  assert.strictEqual(retry.isRetryable('json'), false, 'json 不应重试');
  const plan = retry.getRetryPlan ? retry.getRetryPlan('timeout') : null;
  assert.ok(plan && typeof plan === 'object', `getRetryPlan(timeout) 应返回对象: ${JSON.stringify(plan)}`);
  // 真实返回形如 {"shouldRetry":true,"delayMs":827,"attempt":1}（带抖动的指数退避）
  assert.strictEqual(plan.shouldRetry, true, 'timeout 的重试计划必须 shouldRetry=true');
  assert.ok(typeof plan.delayMs === 'number' && plan.delayMs > 0, `必须给出具体延迟: ${JSON.stringify(plan)}`);
});

test('r428 承重：getRecoverySuggestion 返回非空建议', async () => {
  const hf = await freshHf();
  const r = await hf.dispatch('errorHandler.getRecoverySuggestion', 'timeout', new Error('ETIMEDOUT'));
  assert.ok(r && !r.error, `getRecoverySuggestion 应可执行: ${JSON.stringify(r)}`);
  const s = JSON.stringify(r);
  assert.ok(s.length > 10, '恢复建议不得是空壳');
  assert.ok(!/^(null|undefined|\{\})$/.test(s.trim()), '返回不得恒为 null/空对象');
});

// ─── 五、MCP 侧三处同步层 ─────────────────────────────────

test('r428 MCP：HANDLERS 与 tools-registry 三处同步', async () => {
  const path = require('node:path');
  const fs = require('node:fs');
  const serverSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'mcp-server.js'), 'utf8');
  const regSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'mcp', 'tools-registry.js'), 'utf8');
  for (const name of ['heartflow_cognitive_protocol', 'heartflow_error_handler']) {
    assert.ok(serverSrc.includes(`function handle${name === 'heartflow_cognitive_protocol' ? 'CognitiveProtocolTool' : 'ErrorHandlerTool'}(args)`),
      `mcp-server.js 必须有 ${name} 的 handler 函数`);
    assert.ok(new RegExp(`${name}:\\s*handle`).test(serverSrc),
      `mcp-server.js HANDLERS 表必须注册 ${name}`);
    assert.ok(regSrc.includes(`name: '${name}'`), `tools-registry.js 必须定义工具 ${name}`);
  }
});

test('r428 MCP：新工具走只读/自身状态写，不需要写权限收口', async () => {
  // 两个新工具均未进 WRITE_TOOLS（无跨调用方状态变更），
  // 与 r424 selfVerifier 同判；若未来新增写语义需同步三处（见 AGENTS.md）。
  const path = require('node:path');
  const fs = require('node:fs');
  const serverSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'mcp-server.js'), 'utf8');
  const lines = serverSrc.split('\n');
  const start = lines.findIndex(l => l.includes('const WRITE_TOOLS = new Set(['));
  assert.ok(start >= 0, '应能找到 WRITE_TOOLS Set 定义');
  // 从定义行向后找到闭合行 `]);`
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s*\]\);?\s*$/.test(lines[i])) { end = i; break; }
  }
  assert.ok(end > start, '应能找到 WRITE_TOOLS 的闭合行');
  const block = lines.slice(start, end + 1).join('\n');
  assert.ok(!block.includes('heartflow_cognitive_protocol'), 'cognitive_protocol 是只读工具，不该进 WRITE_TOOLS');
  assert.ok(!block.includes('heartflow_error_handler'), 'error_handler 是只读工具，不该进 WRITE_TOOLS');
});
