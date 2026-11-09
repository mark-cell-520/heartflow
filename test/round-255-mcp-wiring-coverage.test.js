/**
 * round-255-mcp-wiring-coverage.test.js
 *
 * r255 轮测试：HandlerWiringChecker 从「8 条子系统依赖工具」扩到「全部已广告工具 ×
 * 全部 handler」的全量接线矩阵 + heartflow_active_inference 装饰性实现修复。
 *
 * 轮初实测（scripts/tmp-255-wiring-probe.js，真实三张表）：
 *   advertised 187 / handlers 191 / writeTools 33
 *   · [1] advertised-but-no-handler = 0（r253 前那类「广告了却恒 -32601」已归零）
 *   · [2] handler-but-not-advertised = 4
 *       —— heartflow_self_benchmark / heartflow_safe_fetch / heartflow_circuit_breaker
 *          三条在 extended-tools.js 头部「排除项」里有意为之；
 *       —— heartflow_active_inference **不在任何排除清单里**：未广告、未进
 *          WRITE_TOOLS、也未通过 extended-tools.js 的 fs 快照只读验证，guest 可调
 *          而写安全性从未实测。
 *   · [4] write-not-advertised = 2（safe_fetch / circuit_breaker，均属上述白名单）
 *   · [5] schema defects = 0 / [3] 重名 = 0
 *
 * 顺带查证 heartflow_active_inference 是真装饰（不只是未广告）：handler 把
 * candidates 硬编码成单元素数组，而 ActiveInference.decide() 见 length===1 直接
 * 返回 {autoSelect:true} 短路——EFE 评分/排序/needsMoreEvidence 整条路径从 MCP 侧
 * 100% 不可达；且每次调用 new 新实例，getStats() 恒返回 null。
 *
 * 运行：node test/round-255-mcp-wiring-coverage.test.js
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

const { HandlerWiringChecker, KNOWN_UNADVERTISED } = require(path.join(HF, 'src/mcp/handler-wiring-check.js'));
const reg = require(path.join(HF, 'src/mcp/tools-registry.js'));
const TOOL_NAMES = reg.TOOLS.map(x => x.name);

// [r252 坑] 子进程 require mcp-server 后 stdio-guard 把 console.log 改道 stderr，
// 用 spawnSync 拿 stdout+stderr 两份一起找标记行。
function runChild(script) {
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, ['-e', script], {
    cwd: HF,
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 64 * 1024 * 1024,
    env: Object.assign({}, process.env, { HEARTFLOW_MCP_TOKEN: 'round-255-probe-token' }),
  });
  const combined = `${r.stdout || ''}\n${r.stderr || ''}`;
  const lines = {};
  for (const l of combined.trim().split('\n')) {
    const m = l.match(/^([A-Z0-9_]+):(.*)$/);
    if (m && !(m[1] in lines)) lines[m[1]] = m[2];
  }
  if (!('RESULT' in lines)) throw new Error(`子进程未输出 RESULT 行。status=${r.status}\n${combined.slice(-900)}`);
  return { result: JSON.parse(lines.RESULT), lines };
}

// ═══════════════════════════════════════════════
// A 族 — 结构层：真实三张表上的全量接线矩阵
// ═══════════════════════════════════════════════

t('A1 接线表没给就如实说 wiring_source_not_provided，不编数字', () => {
  const r = new HandlerWiringChecker(null).checkStructural();
  assert.strictEqual(r.source, 'not_provided', '来源应标记为未提供');
  assert.strictEqual(r.reason, 'wiring_source_not_provided');
  assert.strictEqual(r.advertised, 0);
  assert.strictEqual(r.reachable, 0);
  assert.strictEqual(r.healthy, false, '没有接线表不能判健康');
  assert.strictEqual(r.issues.length, 0, '没有输入就不该产出发现项');
});

t('A2 真实三张表：每个已广告工具都有 handler（r253 前那类 bug 归零）', () => {
  const wiring = {
    tools: reg.TOOLS,
    handlerNames: TOOL_NAMES.slice(0, 5), // 只给 5 个 handler —— 应测出其余全部缺失
    writeTools: [],
    readOnlyTools: reg.EXTENDED_TOOLS,
  };
  const r = new HandlerWiringChecker(null, wiring).checkStructural();
  assert.strictEqual(r.advertised, TOOL_NAMES.length, 'advertised 应等于工具表长度');
  assert.strictEqual(r.reachable, 5, '只有 5 个工具有 handler');
  assert.strictEqual(r.healthy, false, '大量广告工具无 handler 时应判不健康');
  const missing = r.issues.filter(i => i.kind === 'advertised_no_handler');
  assert.strictEqual(missing.length, TOOL_NAMES.length - 5, '每个无 handler 的广告工具一条发现');
  for (const m of missing) {
    assert.strictEqual(m.severity, 100, '广告了却调不到是最高severity');
    assert.ok(/-32601/.test(m.detail), 'detail 应说明调用恒返回 -32601');
  }
});

t('A3 全量矩阵覆盖全部已广告工具，而不是只覆盖手登记那 8 条', () => {
  const src = fs.readFileSync(path.join(HF, 'src/mcp/handler-wiring-check.js'), 'utf8');
  // 结构层必须遍历调用方给的整张工具表（而不是写死的小清单）
  assert.ok(/for \(const t of tools\)/.test(src), '结构层应遍历全部已广告工具');
  assert.ok(/for \(const name of handlerSet\)/.test(src), '结构层应遍历全部 handler');
  const subCount = (src.match(/\{ tool: 'heartflow_/g) || []).length;
  assert.strictEqual(subCount, 8, `子系统层仍应只有 8 条登记，实际 ${subCount}`);
});

t('A4 每个未广告 handler 都必须能在 KNOWN_UNADVERTISED 里找到出处（白名单闭环）', () => {
  for (const [tool, reason] of Object.entries(KNOWN_UNADVERTISED)) {
    assert.ok(typeof reason === 'string' && reason.length > 10, `${tool} 的排除理由不能为空`);
    assert.ok(!TOOL_NAMES.includes(tool), `${tool} 不应同时出现在工具表里（否则白名单条目说谎）`);
  }
  const src = fs.readFileSync(path.join(HF, 'src/mcp/handler-wiring-check.js'), 'utf8');
  for (const tool of Object.keys(KNOWN_UNADVERTISED)) {
    assert.ok(src.includes(tool), `白名单条目 ${tool} 应在源码里可审计`);
  }
});

t('A5 重名工具被测出（TOOLS.find 只命中第一条，后者被永久遮蔽）', () => {
  const wiring = {
    tools: [
      { name: 'heartflow_think', description: 'd', inputSchema: { type: 'object', properties: {} } },
      { name: 'heartflow_think', description: 'd2', inputSchema: { type: 'object', properties: {} } },
    ],
    handlerNames: ['heartflow_think'],
    writeTools: [], readOnlyTools: [],
  };
  const r = new HandlerWiringChecker(null, wiring).checkStructural();
  const dup = r.issues.filter(i => i.kind === 'duplicate_name');
  assert.strictEqual(dup.length, 1, '应报 1 条重名');
  assert.strictEqual(dup[0].severity, 80);
  assert.strictEqual(r.advertisedUnique, 1, '去重后应只有 1 个');
  assert.strictEqual(r.healthy, false);
});

t('A6 schema 三类缺陷各自被测出（中央校验与空参数保护都建立在 schema 上）', () => {
  const wiring = {
    tools: [
      { name: 't_nodesc' },                                                        // description + inputSchema 双缺
      { name: 't_badtype', description: 'd', inputSchema: { type: 'string', properties: {} } },
      { name: 't_badreq', description: 'd', inputSchema: { type: 'object', properties: { a: { type: 'string' } }, required: ['b'] } },
    ],
    handlerNames: ['t_nodesc', 't_badtype', 't_badreq'],
    writeTools: [], readOnlyTools: [],
  };
  const r = new HandlerWiringChecker(null, wiring).checkStructural();
  const sd = r.issues.filter(i => i.kind === 'schema_defect');
  assert.strictEqual(sd.length, 3, `三个工具都应有 schema 缺陷，实际 ${sd.length}`);
  const byTool = Object.fromEntries(sd.map(i => [i.tool, i.detail]));
  assert.ok(/description/.test(byTool['t_nodesc']), '缺 description 应报');
  assert.ok(/inputSchema 缺失/.test(byTool['t_nodesc']), '缺 inputSchema 应报');
  assert.ok(/type="string"/.test(byTool['t_badtype']), 'inputSchema.type≠object 应报');
  assert.ok(/required 参数 b/.test(byTool['t_badreq']), 'required 不在 properties 里应报');
  assert.ok(/中央校验/.test(byTool['t_badreq']), 'detail 应说明后果（合法调用恒被拒）');
});

t('A7 写权限白名单的两种坏形状各自被测出', () => {
  const wiring = {
    tools: [{ name: 'heartflow_think', description: 'd', inputSchema: { type: 'object', properties: {} } }],
    handlerNames: ['heartflow_think', 'heartflow_self_heal'],  // self_heal 有 handler、未广告、不在白名单
    writeTools: ['heartflow_decision_decide'],                 // 无 handler（死条目）且未广告未登记（隐身）
    readOnlyTools: [],
  };
  const r = new HandlerWiringChecker(null, wiring).checkStructural();
  const dead = r.issues.filter(i => i.kind === 'write_no_handler');
  assert.strictEqual(dead.length, 1, 'WRITE_TOOLS 里的死条目应被测出');
  assert.strictEqual(dead[0].tool, 'heartflow_decision_decide');
  const hidden = r.issues.filter(i => i.kind === 'write_not_advertised');
  assert.strictEqual(hidden.length, 1, '未登记排除的隐身写工具应被测出');
  assert.strictEqual(hidden[0].tool, 'heartflow_decision_decide');
  assert.strictEqual(hidden[0].severity, 50, '隐身写工具应足以让 healthy 翻假');
  assert.strictEqual(r.healthy, false);
  // 未进白名单也未广告的 handler 同时是「写安全性从未实测」的洞
  const hole = r.issues.filter(i => i.kind === 'unverified_write_safety');
  assert.strictEqual(hole.length, 1, '未登记未广告 handler 应判写安全性未实测');
  assert.strictEqual(hole[0].tool, 'heartflow_self_heal');
});

t('A8 未广告 ∧ 未进 WRITE_TOOLS ∧ 未过只读验证的 handler 被抓出来（r255 轮初真发现）', () => {
  const wiring = {
    tools: [{ name: 'heartflow_think', description: 'd', inputSchema: { type: 'object', properties: {} } }],
    handlerNames: ['heartflow_think', 'heartflow_active_inference', 'heartflow_self_benchmark'],
    writeTools: [],
    readOnlyTools: [{ name: 'heartflow_think', description: 'd', inputSchema: { type: 'object', properties: {} } }],
  };
  const r = new HandlerWiringChecker(null, wiring).checkStructural();
  const hole = r.issues.filter(i => i.kind === 'unverified_write_safety');
  assert.strictEqual(hole.length, 1, '只有未登记的那条应判「写安全性从未实测」');
  assert.strictEqual(hole[0].tool, 'heartflow_active_inference');
  const notAdv = r.issues.filter(i => i.kind === 'handler_not_advertised' && !i.byDesign);
  assert.strictEqual(notAdv.length, 1, '白名单内的未广告 handler 不应重复计为漂移');
  assert.ok(r.issues.some(i => i.tool === 'heartflow_self_benchmark' && i.byDesign === true), '白名单条目应带 byDesign 标记');
});

t('A9 探针/脏数据不让自检自己崩：非字符串 name 的条目被过滤而非抛错', () => {
  const wiring = {
    tools: [null, 42, { name: 'heartflow_think', description: 'd', inputSchema: { type: 'object', properties: {} } }],
    handlerNames: ['heartflow_think', null, 7],
    writeTools: [null],
    readOnlyTools: [null],
  };
  const r = new HandlerWiringChecker(null, wiring).checkStructural();
  assert.strictEqual(r.advertised, 1, '脏条目应被过滤，只数合法工具');
  assert.strictEqual(r.handlers, 1, '脏 handler 名应被过滤');
  assert.strictEqual(r.reachable, 1);
  assert.strictEqual(r.healthy, true);
});

// ═══════════════════════════════════════════════
// B 族 — 两层合查 + 存量形状不回归（r253 的 8 条）
// ═══════════════════════════════════════════════

t('B1 完整引擎上子系统层仍 8/8 可达（r253 断言原样成立）', () => {
  assert.ok(hf, '引擎应启动成功');
  const r = new HandlerWiringChecker(hf).check();
  assert.strictEqual(r.engineReady, true);
  assert.strictEqual(r.total, 8, `子系统层应仍登记 8 条，实际 ${r.total}`);
  assert.strictEqual(r.reachable, 8, `8 条应全部可达，unreachable=${JSON.stringify(r.unreachable)}`);
  assert.strictEqual(r.healthy, true);
  assert.ok(/仅覆盖/.test(r.note || ''), 'note 仍应写清子系统层的覆盖范围');
});

t('B2 check() 既有字段形状一个没少（加法原则）', () => {
  const r = new HandlerWiringChecker(hf).check();
  for (const k of ['engineReady', 'total', 'reachable', 'unreachable', 'healthy', 'checkedAt', 'note']) {
    assert.ok(k in r, `check() 应保留字段 ${k}`);
  }
  assert.ok(!('toolWiring' in r), 'check() 本身不应混入结构层字段（那是 checkAll 的加法字段）');
  const all = new HandlerWiringChecker(hf, { tools: reg.TOOLS, handlerNames: ['heartflow_think'], writeTools: [], readOnlyTools: [] }).checkAll();
  assert.ok(all.toolWiring && typeof all.toolWiring.advertised === 'number', 'checkAll 应以 toolWiring 加法字段带出结构层');
});

t('B3 坏引擎上子系统层仍能测出坏接线（r253 F2 同款夹具）', () => {
  const broken = {
    boundaryGuard: undefined,
    kvCache: { _stats: { hits: 'not-a-number' } },
    _decisionHistory: [],
    _modules: {
      errorMemory: { store: () => {}, query: () => {} },
      errorTaxonomy: { fix: () => {}, classify: () => {} },
    },
  };
  const r = new HandlerWiringChecker(broken).check();
  assert.strictEqual(r.healthy, false);
  const bad = r.unreachable.map(u => u.tool);
  for (const tool of ['heartflow_boundary_check', 'heartflow_cache_stats', 'heartflow_error_verify']) {
    assert.ok(bad.includes(tool), `${tool} 的坏接线应被测出`);
  }
});

t('B4 引擎未就绪时如实报 engine_not_ready，不假报 total', () => {
  const r = new HandlerWiringChecker(null).check();
  assert.strictEqual(r.engineReady, false);
  assert.strictEqual(r.reason, 'engine_not_ready');
  assert.strictEqual(r.total, 0);
  assert.strictEqual(r.healthy, false);
});

// ═══════════════════════════════════════════════
// C 族 — heartflow_active_inference 装饰性实现修复
// ═══════════════════════════════════════════════

t('C1 多候选走真 EFE 评分，不再恒 autoSelect 短路', () => {
  const { ActiveInference } = require(path.join(HF, 'src/decision/active-inference.js'));
  const inst = new ActiveInference({ silent: true });
  const r = inst.decide([
    { id: 'a', label: '高分候选', pragmaticScore: 0.95, uncertainty: 0.1 },
    { id: 'b', label: '低分候选', pragmaticScore: 0.2, uncertainty: 0.1 },
  ], {});
  assert.ok(!r.autoSelect, '两个候选不应走 autoSelect 短路');
  assert.ok(Array.isArray(r.scores) && r.scores.length === 2, '应返回逐候选评分');
  assert.strictEqual(r.selected.id, 'a', '最高分候选应被选中');
  for (const s of r.scores) {
    assert.ok(typeof s.expectedFreeEnergy === 'number', '每条评分应含 EFE');
    assert.ok(typeof s.pragmaticValue === 'number' && typeof s.epistemicValue === 'number', '应拆出实用/认知两路价值');
  }
  assert.ok(typeof r.needsMoreEvidence === 'boolean', '应给出是否需要更多证据');
  assert.ok(['explore', 'exploit', 'balanced'].includes(r.activeInference.regime), '应给出决策regime');
});

t('C2 源码里不再有硬编码单候选（回归断言，精确到 handler 体）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  const start = src.indexOf('heartflow_active_inference: (args) => {');
  assert.ok(start > -1, 'HANDLERS 里应还有 heartflow_active_inference');
  const end = src.indexOf('\n  },', start);
  const body = src.slice(start, end);
  assert.ok(/args\?\.candidates/.test(body), 'handler 应读调用方传入的 candidates');
  assert.ok(!/\[\{ id: 'a'/.test(body), '不得再把 candidates 硬编码成单元素数组');
  assert.ok(!/new ActiveInference\(/.test(body), '不得再每次调用 new 新实例（历史被清零）');
  assert.ok(/_activeInferenceInst\(\)/.test(body), '应复用模块级单例');
  assert.ok(/action === 'stats'/.test(body), '应暴露 stats 动作读决策历史');
});

t('C3 handler 对空 candidates 给出可操作的错误，而不是静默返回空', () => {
  const inst = new (require(path.join(HF, 'src/decision/active-inference.js')).ActiveInference)({ silent: true });
  assert.strictEqual(inst.decide([], {}), null, 'decide() 对空候选返回 null（模块既定行为）');
  const src = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  const start = src.indexOf('heartflow_active_inference: (args) => {');
  const body = src.slice(start, src.indexOf('\n  },', start));
  assert.ok(/candidates\.length === 0/.test(body), 'handler 应在调 decide 前拦住空候选');
  assert.ok(/expectedParams/.test(body), '错误应带 expectedParams，告诉调用方该传什么');
});

// ═══════════════════════════════════════════════
// D 族 — MCP 三处接线（约定 3）+ 端到端
// ═══════════════════════════════════════════════

t('D1 工具定义在册：heartflow_wiring_check 与 heartflow_active_inference', () => {
  const byName = Object.fromEntries(reg.TOOLS.map(x => [x.name, x]));
  const wc = byName['heartflow_wiring_check'];
  assert.ok(wc, 'tools-registry 应定义 heartflow_wiring_check');
  assert.ok(wc.description && wc.description.length > 50, 'description 应写清两层语义');
  const en = wc.inputSchema.properties.action.enum;
  for (const a of ['check', 'structural', 'tools', 'write']) assert.ok(en.includes(a), `action 枚举应含 ${a}`);
  const ai = byName['heartflow_active_inference'];
  assert.ok(ai, 'tools-registry 应定义 heartflow_active_inference');
  assert.ok(ai.inputSchema.properties.candidates, 'active_inference 应声明 candidates 入参');
  assert.ok(ai.inputSchema.required.includes('candidates'), 'candidates 应为必填');
});

t('D2 handler 映射 + 实现在册（约定 3 的后两处）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  assert.ok(/heartflow_wiring_check:\s*handleWiringCheck/.test(src), 'HANDLERS 应登记 heartflow_wiring_check');
  assert.ok(/function handleWiringCheck\(args\)/.test(src), '应有用例调用的 handler 函数');
  for (const a of ['structural', 'tools', 'write']) {
    assert.ok(src.includes(`action === '${a}'`), `handler 应处理 action=${a}`);
  }
  assert.ok(/heartflow_active_inference:/.test(src), 'HANDLERS 应仍登记 heartflow_active_inference');
  assert.ok(/new HandlerWiringChecker\(heartflow, \{/.test(src), 'handleWiringCheck 应注入三张表构造结构层');
  assert.ok(/readOnlyTools: EXTENDED_TOOLS/.test(src), '应把 EXTENDED_TOOLS 只读验证集注入结构层');
});

t('D3 handleModuleHealth 以加法字段带出结构层，summary 形状不变', () => {
  const src = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  assert.ok(/new HandlerWiringChecker\(heartflow\)\.check\(\)/.test(src), 'r253 固化的子系统层调用应原样保留');
  assert.ok(/handlerWiring\.toolWiring = new HandlerWiringChecker\(/.test(src), '应追加 toolWiring 加法字段');
  assert.ok(/structural_check_failed/.test(src), '结构层失败应有独立兜底，不拖垮子系统层');
  assert.ok(/const summary = checker\.getSummary\(\);/.test(src), 'summary 仍由 ModuleHealthChecker 产出（r251 断言依赖其形状）');
});

t('D4 独立子进程端到端：wiring_check 四档 + active_inference 三形态都真实返回', () => {
  const script = `
    const srv = require(${JSON.stringify(path.join(HF, 'src/mcp-server.js').replace(/\\/g, '\\\\'))});
    (async () => {
      srv.initHeartFlow();
      const H = srv.handleRequest;
      const call = (name, args) => H({ jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name, arguments: args } }, null, { __stdio: true });
      const txt = r => { const c = r && (r.content || (r.result && r.result.content)); return c && c[0] ? c[0].text : JSON.stringify(r); };
      const one = s => { try { return JSON.stringify(JSON.parse(s)); } catch (e) { return JSON.stringify({ __unparsed: String(s).slice(0, 300) }); } };
      const out = {};
      const chk = JSON.parse(txt(await call('heartflow_wiring_check', { action: 'check' })));
      out.sub = { total: chk.result.total, reachable: chk.result.reachable, healthy: chk.result.healthy };
      out.struct = chk.result.toolWiring;
      const st = JSON.parse(txt(await call('heartflow_wiring_check', { action: 'structural' })));
      out.structOnly = { advertised: st.result.advertised, handlers: st.result.handlers, reachable: st.result.reachable, healthy: st.result.healthy };
      const tl = JSON.parse(txt(await call('heartflow_wiring_check', { action: 'tools' })));
      out.rows = { total: tl.result.total, first: tl.result.rows[0] };
      const wr = JSON.parse(txt(await call('heartflow_wiring_check', { action: 'write' })));
      out.write = { count: wr.result.count, first: wr.result.writeTools[0] };
      const ai = JSON.parse(txt(await call('heartflow_active_inference', { candidates: [
        { id: 'a', label: '重写', pragmaticScore: 0.9, uncertainty: 0.2 },
        { id: 'b', label: '先回归', pragmaticScore: 0.6, uncertainty: 0.8 },
        { id: 'c', label: '放弃', pragmaticScore: 0.1, uncertainty: 0.1 } ] })));
      out.ai = { autoSelect: !!(ai.result && ai.result.autoSelect), n: ai.result && ai.result.scores ? ai.result.scores.length : 0,
                 selected: ai.result && ai.result.selected ? ai.result.selected.id : null,
                 regime: ai.result && ai.result.activeInference ? ai.result.activeInference.regime : null,
                 needsMore: ai.result ? ai.result.needsMoreEvidence : null };
      const st2 = JSON.parse(txt(await call('heartflow_active_inference', { action: 'stats' })));
      out.stats = st2.stats;
      const empty = JSON.parse(txt(await call('heartflow_active_inference', { candidates: [] })));
      out.emptyErr = empty.error ? empty.error.slice(0, 20) : null;
      const mh = JSON.parse(txt(await call('heartflow_module_health', {})));
      out.mh = { hasToolWiring: !!(mh.handlerWiring && mh.handlerWiring.toolWiring),
                 summaryKeys: Object.keys(mh.summary || {}).sort().join(','),
                 subTotal: mh.handlerWiring.total, subHealthy: mh.handlerWiring.healthy };
      console.log('RESULT:' + one(JSON.stringify(out)));
      process.exit(0);
    })().catch(e => { console.error('SUBERR', e); process.exit(1); });
  `;
  const { result: out } = runChild(script);

  // wiring_check 四档
  assert.strictEqual(out.sub.total, 8, '子系统层应仍探 8 条');
  assert.strictEqual(out.sub.reachable, 8, '子系统层 8 条应全部可达');
  assert.strictEqual(out.sub.healthy, true);
  assert.ok(out.struct && typeof out.struct.advertised === 'number', 'check 档应带出结构层');
  assert.ok(out.structOnly.advertised >= 187, 'structural 档 advertised 不应比轮前 187 少');
  assert.strictEqual(out.structOnly.reachable, out.structOnly.advertised, '每个已广告工具都应有 handler');
  assert.strictEqual(out.structOnly.handlers, out.structOnly.advertised + Object.keys(KNOWN_UNADVERTISED).length,
    'handler 数应恰好等于 已广告 + 白名单内的未广告 handler（白名单闭环不变量）');
  assert.strictEqual(out.structOnly.healthy, true, '当前接线矩阵应判健康');
  assert.ok(out.rows.total > out.structOnly.advertised, 'tools 档宽表应含未广告 handler 行');
  assert.strictEqual(out.rows.first.advertised, true, '宽表首行应是已广告工具');
  assert.ok(out.write.count >= 30, 'write 档应导出写权限白名单');
  assert.strictEqual(out.write.first.handled, true, '白名单里的工具都应有 handler');

  // active_inference 三形态
  assert.strictEqual(out.ai.autoSelect, false, '多候选不应走 autoSelect 短路');
  assert.strictEqual(out.ai.n, 3, '应逐候选评分');
  assert.strictEqual(out.ai.selected, 'a', '最高分候选应被选中');
  assert.ok(['explore', 'exploit', 'balanced'].includes(out.ai.regime), '应给出 regime');
  assert.strictEqual(typeof out.ai.needsMore, 'boolean');
  assert.ok(out.stats && out.stats.totalDecisions >= 1, 'stats 档应读到决策历史（轮前恒 null）');
  assert.ok(out.emptyErr && /候选/.test(out.emptyErr), '空 candidates 应报可操作错误');

  // module_health 加法字段 + summary 形状
  assert.strictEqual(out.mh.hasToolWiring, true, 'module_health 应带出结构层');
  assert.ok(out.mh.summaryKeys.includes('healthScore'), 'summary 既有键不应丢');
  assert.strictEqual(out.mh.subTotal, 8);
  assert.strictEqual(out.mh.subHealthy, true);
});

// ═══════════════════════════════════════════════
// E 族 — 存量行为回归
// ═══════════════════════════════════════════════

t('E1 判别引擎三招牌入口未受影响', () => {
  const gate = require(path.join(HF, 'src/gate.js'));
  const bad = gate.checkOutput('毫无疑问，这是唯一正确的解决方案。');
  assert.strictEqual(bad.gate.action, 'rewrite', '绝对化断言仍应判 rewrite');
  const benign = gate.checkOutput('今天天气不错，适合出去散步。');
  assert.strictEqual(benign.gate.action, 'pass', '良性句仍应判 pass');
});

t('E2 维度数与 action-tier 计数未变（本轮未加判别维度）', () => {
  const { discriminate } = require(path.join(HF, 'src/index.js'));
  const d = discriminate('neutral baseline text');
  const keys = Object.keys(d.dimensions || {});
  assert.strictEqual(keys.length, 210, `维度数应仍为 210，实际 ${keys.length}`);
  const idx = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  for (const [label, n] of [['BLOCK_DIMS', 11], ['REWRITE_DIMS', 19], ['VERIFY_DIMS', 167]]) {
    const m = idx.match(new RegExp(`const ${label} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
    const cnt = m ? (m[1].match(/['"][a-z_]+['"]/g) || []).length : 0;
    assert.strictEqual(cnt, n, `${label} 应仍为 ${n}，实际 ${cnt}`);
  }
});

t('E3 新工具不悄悄变成写工具（guest 权限面未扩大）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  const m = src.match(/const WRITE_TOOLS = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m, '应能取到 WRITE_TOOLS 集合');
  const listed = (m[1].match(/['"](heartflow_[a-z0-9_]+)['"]/g) || []).map(s => s.slice(1, -1));
  assert.ok(!listed.includes('heartflow_wiring_check'), 'wiring_check 是纯只读自检，不应进写权限白名单');
  assert.ok(!listed.includes('heartflow_active_inference'), 'active_inference 是纯内存计算，不应进写权限白名单');
  for (const name of listed) {
    assert.ok(TOOL_NAMES.includes(name) || Object.keys(KNOWN_UNADVERTISED).includes(name),
      `WRITE_TOOLS 条目 ${name} 应要么已广告要么在白名单里（权限纪律三处一致）`);
  }
});

(async () => {
  await Promise.all(asyncTests);
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length} 通过, ${failed.length} 失败`);
  if (failed.length) {
    for (const f of failed) console.log(`  ❌ ${f.name}\n     ${f.err}`);
    process.exit(1);
  }
  process.exit(0);
})();
