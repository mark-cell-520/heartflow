// round-258-route-wiring-matrix.test.js
// [r258] dispatch 路由层接线矩阵（r255 已知未修④「结构层不覆盖 dispatch 路由层」落地）
//
// 轮前实测的两个缺口（scripts/tmp-258-probe*.js）：
//   ① routes() 原型链分支漏 `!m.startsWith('_')` 过滤——class 实例的私有原型
//      方法全部泄漏进接口面，实测 **653 条**幽灵路由，每条还被可达性标注渲染成
//      `[未注册，dispatch 会拒绝]`，看起来像 653 个待接线缺口（实际 100% 是私有
//      方法，按 dispatch 约定本就不该有路由）；
//   ② 手写白名单 **14 条陈旧条目**承诺模块上不存在的方法（memory.remove /
//      lesson.addLesson / dream.dreamNow / slots.get …全是改名/删除残留），调用
//      即 TypeError，而 routes() 从不显示它们。
// 本轮落地：routes() 补过滤（口径对齐 generateAllowedRoutes 两分支 + own 分支）、
// 白名单删 14 条、新模块 RouteWiringChecker（三表矩阵）、HeartFlow.routeWiringTrace()
// 公开方法、MCP 工具 heartflow_route_wiring、HandlerWiringChecker.checkAll 第三层。
//
// 纪律（继承 r256/r257 踩坑）：**「轮前」用变异副本复现，不用 git rev**——rev 会随
// 每轮提交漂移（round-256 A1 用 HEAD、round-257 改 HEAD~1，两次都只把失效推迟了
// 一轮）。变异副本与提交状态完全解耦。
'use strict';

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_HF = path.join(ROOT, 'src/core/heartflow.js');
const SRC_REG = path.join(ROOT, 'src/mcp/tools-registry.js');
const SRC_SRV = path.join(ROOT, 'src/mcp-server.js');
const SRC_HWC = path.join(ROOT, 'src/mcp/handler-wiring-check.js');

const { RouteWiringChecker } = require('../src/core/route-wiring-check.js');
const { HeartFlow } = require('../src/core/heartflow.js');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// r258 轮前白名单删除的 14 条 stale 条目（改名/删除后的残留）
const STALE14 = [
  'memory.remove', 'memory.getLayers',
  'lesson.addLesson', 'lesson.getRecent',
  'dream.dreamNow', 'dream.analyzeDream',
  'verify.checkConsistency',
  'psychology.analyze', 'psychology.detectCrisis',
  'confidence.admit',
  'graph.search',
  'slots.get', 'slots.set', 'slots.delete',
];

// 整棵 src/ 复制到临时目录做变异（r257 makeCopy 同款；绝不原地改写 src/）
function makeCopy(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r258-' + tag + '-'));
  for (const f of ['VERSION', 'package.json']) {
    try { fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f)); } catch (e) { /* 缺文件不致命 */ }
  }
  cp.execFileSync(process.execPath,
    ['-e', `const fs=require('fs'),p=require('path');
function w(s,d){fs.mkdirSync(d,{recursive:true});
for(const e of fs.readdirSync(s,{withFileTypes:true})){
const a=p.join(s,e.name),b=p.join(d,e.name);
if(e.isDirectory())w(a,b);else fs.copyFileSync(a,b);}}
w(process.argv[1],process.argv[2]);`,
      path.join(ROOT, 'src'), path.join(tmp, 'src')],
    { stdio: 'ignore' });
  return tmp;
}

// 在变异副本里同步构造引擎跑 routeWiringTrace（同步 start() 后 _modules 即就绪，
// 实测 <1s——dispatch-route-integrity.test.js 同款用法）。
// stdout 会混进引擎日志（[FormulaSearch]/init 事件都走 console.log），所以 JSON 输出
// 加 __R258__ 标记行、父进程从标记后截取——不靠「最后一行」（日志可能在 JSON 之后）。
function traceIn(root) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const m=require(${JSON.stringify(path.join(root, 'src/core/heartflow.js'))});
const e=new m.HeartFlow({rootPath:${JSON.stringify(root)}, silent:true});
e.start();
const t=e.routeWiringTrace();
console.log('__R258__'+JSON.stringify({v:t.verdict,m:t.matrix,g:t.kinds.ghostPrivate.length,
u:t.kinds.unregisteredPublic.length,s:t.kinds.staleWhitelist.length,h:t.healthy,
issues:t.issues.map(i=>({k:i.kind,r:i.route,d:i.detail.slice(0,40)}))}));`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], cwd: root });
  return JSON.parse(out.split('__R258__').pop().trim());
}

// ─── 主引擎（同步 start，<1s）────────────────────────────────────────────
const engine = new HeartFlow({ rootPath: ROOT, silent: true });
engine.start();
const trace = engine.routeWiringTrace();

console.log('\n[A 节] 修复前（变异副本：routes() 摘 `!m.startsWith(\'_\')` 过滤）→ 后');

test('A1 变异副本复现轮前：routes() 泄漏 653 条私有方法', () => {
  const tmp = makeCopy('ghostpre');
  try {
    const p = path.join(tmp, 'src/core/heartflow.js');
    const orig = fs.readFileSync(p, 'utf8');
    const anchor = ".filter(m => m !== 'constructor' && !m.startsWith('_') && typeof mod[m] === 'function');";
    assert.ok(orig.includes(anchor), 'routes() 原型链分支的过滤锚点不在（源码形状可能已变）');
    const mutated = orig.replace(anchor,
      ".filter(m => m !== 'constructor' && typeof mod[m] === 'function');");
    assert.ok(mutated !== orig, '变异未生效（过滤没被摘掉）');
    fs.writeFileSync(p, mutated, 'utf8');
    const t = traceIn(tmp);
    assert.strictEqual(t.m.ghostPrivate, 653,
      '轮前泄漏数变了——若 ≠653 说明模块集已变（有人增删了模块），需重算本轮增量');
    assert.strictEqual(t.m.unregisteredPublic, 0, '轮前不该有公有未注册缺口');
    assert.strictEqual(t.m.staleWhitelist, 0, '轮前不该有 stale 白名单（14 条是本轮删的）');
    assert.strictEqual(t.v, 'drift', '有 653 条泄漏时 verdict 必须是 drift');
    assert.strictEqual(t.h, false, '有 653 条泄漏时 healthy 必须 false');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('A2 变异副本的 653 条泄漏全部是 _ 开头（按 dispatch 约定不该有路由）', () => {
  const tmp = makeCopy('ghostpre2');
  try {
    const p = path.join(tmp, 'src/core/heartflow.js');
    const orig = fs.readFileSync(p, 'utf8');
    const mutated = orig.replace(
      ".filter(m => m !== 'constructor' && !m.startsWith('_') && typeof mod[m] === 'function');",
      ".filter(m => m !== 'constructor' && typeof mod[m] === 'function');");
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(p, mutated, 'utf8');
    const t = traceIn(tmp);
    const nonUnderscore = t.issues.filter(i => i.k === 'ghost_private' && !/\._/.test(i.r));
    assert.strictEqual(nonUnderscore.length, 0,
      'ghost_private 里出现非下划线方法——泄漏判据错了：' + JSON.stringify(nonUnderscore.slice(0, 3)));
    // 中文方法名（ruleGrowth._固化）与双下划线（counterfactual.__internalConfidence）
    // 也必须是 _ 开头判据的覆盖范围——`\._` 对两者都命中
    assert.ok(t.issues.some(i => /\._[^\x00-\x7F]/.test(i.r)),
      '653 条里应有中文私有方法名（_固化）——抽样面太窄');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('A3 当前源码：653 条幽灵路由清零、verdict=aligned、healthy=true', () => {
  assert.strictEqual(trace.matrix.ghostPrivate, 0, '幽灵路由没清零');
  assert.strictEqual(trace.verdict, 'aligned');
  assert.strictEqual(trace.healthy, true);
  assert.strictEqual(trace.issues.length, 0);
});

test('A4 当前源码 routes() 输出零 `[未注册]` 标注、零下划线方法', () => {
  const table = engine.routes();
  let unreg = 0, underscore = 0, total = 0;
  for (const [name, methods] of Object.entries(table)) {
    for (const raw of (methods || [])) {
      total++;
      const s = String(raw);
      if (s.includes('[未注册')) unreg++;
      if (s.slice(name.length + 1).startsWith('_')) underscore++;
    }
  }
  assert.strictEqual(unreg, 0, '仍有 [未注册] 标注（r258 前 653 条全是私有方法泄漏）');
  assert.strictEqual(underscore, 0, 'routes() 仍暴露下划线方法');
  assert.strictEqual(total, 1305, 'routes() 总条数变了（r258 前 1958 = 1305 公有 + 653 私有）');
});

console.log('\n[B 节] stale 白名单：修复前 14 条 → 后 0 条');

test('B1 当前源码：14 条删除的 stale 路由全部不在 ALLOWED_ROUTES', () => {
  const allowed = HeartFlow.ALLOWED_ROUTES;
  for (const r of STALE14) {
    assert.ok(!allowed.has(r), `${r} 仍在白名单里（陈旧条目没删干净）`);
  }
  assert.strictEqual(trace.matrix.staleWhitelist, 0, '三表矩阵仍报 stale 白名单');
});

test('B2 注入三种 stale detail 各就各位（noModule / noMethod / 表里没有）', () => {
  const mod = { memory: { store() {} } };
  const c = new RouteWiringChecker({
    allowedRoutes: ['memory.remove', 'zzzNotASubsystem.foo', 'memory.store'],
    routesTable: {}, // 表里没有上面任何一条
    modules: mod,
  }).check();
  assert.strictEqual(c.healthy, false);
  const byRoute = {};
  for (const i of c.issues) byRoute[i.route] = i.detail;
  assert.ok(/子系统/.test(byRoute['zzzNotASubsystem.foo'] || ''), 'noModule detail 缺失：' + byRoute['zzzNotASubsystem.foo']);
  assert.ok(/不存在的方法/.test(byRoute['memory.remove'] || ''), 'noMethod detail 缺失：' + byRoute['memory.remove']);
  assert.ok(/routes\(\) 列不出/.test(byRoute['memory.store'] || ''), 'not-in-table detail 缺失：' + byRoute['memory.store']);
  assert.strictEqual(c.byKind.stale_whitelist, 3);
});

test('B3 白名单加回一条 stale（变异注入）→ 立刻翻面报出', () => {
  // 不构造引擎：直接给当前矩阵注入一条假白名单条目
  const c = new RouteWiringChecker({
    allowedRoutes: [...HeartFlow.ALLOWED_ROUTES, 'lesson.addLesson'],
    routesTable: engine.routes(),
    modules: engine._modules,
  }).check();
  assert.strictEqual(c.healthy, false, '白名单重新承诺不存在的方法时必须判不健康');
  const hit = c.issues.find(i => i.route === 'lesson.addLesson');
  assert.ok(hit, 'lesson.addLesson 没被报出来');
  assert.strictEqual(hit.kind, 'stale_whitelist');
  assert.strictEqual(hit.subsystem, 'lesson');
});

console.log('\n[C 节] unregistered_public 真缺口哨兵（现值 0，防回退）');

test('C1 白名单少一条存在路由（注入）→ unregistered_public 报出', () => {
  const table = engine.routes();
  const trimmed = [...HeartFlow.ALLOWED_ROUTES].filter(r => r !== 'memory.store');
  const c = new RouteWiringChecker({ allowedRoutes: trimmed, routesTable: table, modules: engine._modules }).check();
  assert.strictEqual(c.healthy, false);
  const hit = c.issues.find(i => i.route === 'memory.store');
  assert.ok(hit, 'memory.store 从白名单消失后必须被报出');
  assert.strictEqual(hit.kind, 'unregistered_public');
  assert.ok(/不可发现/.test(hit.detail), 'detail 要说清「能力存在却不可发现」');
});

test('C2 带 `[未注册]` 标注后缀的公有方法（routesTable 旧形态）也判 unregistered_public', () => {
  const c = new RouteWiringChecker({
    allowedRoutes: ['x.pub'],
    routesTable: { x: ['x.pub', 'x.other  [未注册，dispatch 会拒绝]'] },
    modules: { x: {} },
  }).check();
  const hit = c.issues.find(i => i.route === 'x.other');
  assert.ok(hit, '标注后缀没被识别');
  assert.strictEqual(hit.kind, 'unregistered_public');
});

test('C3 空矩阵不是 aligned（引擎未启动/输入未注入时如实报）', () => {
  const c = new RouteWiringChecker({ allowedRoutes: [], routesTable: {}, modules: {} }).check();
  assert.strictEqual(c.source, 'empty_matrix');
  assert.strictEqual(c.healthy, false);
  assert.ok(/不是对齐/.test(c.note), 'note 要写清空矩阵不是对齐');
});

console.log('\n[D 节] 当前三表矩阵数字 + dispatch 行为');

test('D1 三表矩阵：allowed=1305 / visible=1305 / intersection=1305 / modules=162', () => {
  assert.deepStrictEqual(trace.matrix, {
    allowed: 1305, routesVisible: 1305, modules: 162, intersection: 1305,
    ghostPrivate: 0, unregisteredPublic: 0, staleWhitelist: 0,
  });
  // 轮前口径：allowed 1319 → 1305（删 14 stale）；visible 1958 → 1305（删 653 幽灵）
});

test('D2 14 条删除的 stale 路由现在 dispatch 抛 not allowed（收紧语义）', () => {
  let notAllowed = 0;
  for (const r of STALE14) {
    try { engine.dispatch(r, {}); }
    catch (e) { if (/not allowed/.test(String(e.message))) notAllowed++; }
  }
  assert.strictEqual(notAllowed, STALE14.length,
    `${STALE14.length - notAllowed} 条删除后仍不抛 not allowed`);
});

test('D3 交集路由抽样 60 条 dispatch 不抛 not allowed（能力没被误删）', () => {
  const visible = new Set();
  for (const methods of Object.values(engine.routes())) {
    for (const raw of (methods || [])) visible.add(String(raw));
  }
  const inter = [...HeartFlow.ALLOWED_ROUTES].filter(r => visible.has(r));
  assert.strictEqual(inter.length, 1305, '交集不是 1305——有 ALLOWED 路由 routes() 看不见');
  const sample = inter.filter((_, i) => i % Math.max(1, Math.floor(inter.length / 60)) === 0).slice(0, 60);
  let notAllowed = 0;
  for (const r of sample) {
    try { engine.dispatch(r, {}); }
    catch (e) { if (/not allowed/.test(String(e.message))) notAllowed++; }
  }
  assert.strictEqual(notAllowed, 0, `${notAllowed}/${sample.length} 条交集路由被 dispatch 拒（白名单删多了）`);
});

test('D4 白名单 1305 条全部可被 routes() 发现（inAllowedNotVisible=0）', () => {
  const visible = new Set();
  for (const methods of Object.values(engine.routes())) {
    for (const raw of (methods || [])) visible.add(String(raw));
  }
  const hidden = [...HeartFlow.ALLOWED_ROUTES].filter(r => !visible.has(r));
  assert.deepStrictEqual(hidden, [], '白名单有 routes() 看不见的路由');
});

console.log('\n[E 节] routeWiringTrace 形状与多态 verdict');

test('E1 九段形状 + verdict=aligned + note 哨兵语义', () => {
  for (const k of ['verdict', 'matrix', 'kinds', 'issues', 'byKind', 'bySubsystem', 'healthy', 'checkedAt', 'note']) {
    assert.ok(k in trace, `缺字段 ${k}`);
  }
  assert.strictEqual(trace.verdict, 'aligned');
  assert.ok(/防回退哨兵/.test(trace.note), 'note 要写清 aligned 是哨兵不是证明');
  assert.ok(Array.isArray(trace.kinds.healthy) && trace.kinds.healthy.length === 1305, 'kinds.healthy 应是 1305 条路由清单');
  assert.ok(trace.checkedAt > 0);
});

test('E2 drift 态：patch 引擎 routes() 注入幽灵路由后 verdict 翻面', () => {
  const orig = engine.routes.bind(engine);
  engine.routes = () => ({
    fake: ['fake.real', 'fake._private'],
  });
  try {
    const t = engine.routeWiringTrace();
    assert.strictEqual(t.verdict, 'drift');
    assert.strictEqual(t.healthy, false);
    assert.strictEqual(t.matrix.ghostPrivate, 1);
    assert.strictEqual(t.matrix.unregisteredPublic, 1);
    assert.ok(t.issues.some(i => i.route === 'fake._private' && i.kind === 'ghost_private'));
    assert.ok(t.issues.some(i => i.route === 'fake.real' && i.kind === 'unregistered_public'));
  } finally { engine.routes = orig; }
});

test('E3 未启动引擎 → verdict=engine-not-ready（不是假的 aligned）', () => {
  const cold = new HeartFlow({ rootPath: ROOT, silent: true });
  const t = cold.routeWiringTrace();
  assert.strictEqual(t.verdict, 'engine-not-ready');
  assert.strictEqual(t.healthy, false);
});

test('E4 输入未注入 → source=not_provided / reason=wiring_source_not_provided', () => {
  const c = new RouteWiringChecker().check();
  assert.strictEqual(c.source, 'not_provided');
  assert.strictEqual(c.reason, 'wiring_source_not_provided');
  assert.strictEqual(c.healthy, false);
});

console.log('\n[F 节] MCP 约定 3 三处接线');

test('F1 工具定义在 tools-registry 且 schema 合法、工具名唯一', () => {
  const reg = fs.readFileSync(SRC_REG, 'utf8');
  assert.ok(reg.includes("name: 'heartflow_route_wiring'"), 'tools-registry 缺工具定义');
  assert.ok(/name:\s*'heartflow_route_wiring'[\s\S]{0,2000}inputSchema:\s*\{\s*"type":"object"/.test(reg),
    '工具定义的 inputSchema 形状不对');
  const { TOOLS } = require('../src/mcp/tools-registry.js');
  const hit = TOOLS.filter(t => t && t.name === 'heartflow_route_wiring');
  assert.strictEqual(hit.length, 1, '工具名重复或缺失');
  assert.ok(hit[0].description && hit[0].description.length > 50, 'description 太短');
  assert.deepStrictEqual(hit[0].inputSchema, { type: 'object', properties: {} });
});

test('F2 HANDLERS 映射 + handler 函数 + 不进 WRITE_TOOLS', () => {
  const srv = fs.readFileSync(SRC_SRV, 'utf8');
  assert.ok(/heartflow_route_wiring:\s*handleRouteWiring/.test(srv), 'HANDLERS 缺映射');
  assert.ok(/function handleRouteWiring\(args\)/.test(srv), 'handler 函数缺失');
  // 不跟踪 WRITE_TOOLS（读源码锚点，避免加载会 process.exit(1) 的 mcp-server）
  const m = srv.match(/const WRITE_TOOLS = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m, 'WRITE_TOOLS 定义没找到');
  assert.ok(!m[1].includes('heartflow_route_wiring'), '只读工具不该进 WRITE_TOOLS');
});

test('F3 handler 缺引擎契约 + 子进程端到端（独立 require 无缓存污染）', () => {
  const srv = fs.readFileSync(SRC_SRV, 'utf8');
  assert.ok(srv.includes("return { error: '引擎未就绪（routeWiringTrace 需要 started 且 _modules 非空）', expectedParams: [], timestamp: Date.now() };"),
    'handler 引擎未就绪时应返回带 expectedParams 的可操作错误');
  const out = cp.execFileSync(process.execPath,
    ['-e', `const m=require(${JSON.stringify(SRC_HF)});
const e=new m.HeartFlow({rootPath:${JSON.stringify(ROOT)}, silent:true});
e.start();
const t=e.routeWiringTrace();
console.log('__R258__'+JSON.stringify({v:t.verdict,a:t.matrix.allowed,i:t.matrix.intersection,g:t.matrix.ghostPrivate}));`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const r = JSON.parse(out.split('__R258__').pop().trim());
  assert.strictEqual(r.v, 'aligned');
  assert.strictEqual(r.a, 1305);
  assert.strictEqual(r.i, 1305);
  assert.strictEqual(r.g, 0);
});

console.log('\n[G 节] HandlerWiringChecker 第三层（checkAll 加法字段）');

test('G1 checkAll 含 routeWiring 加法字段（引擎路径）且两层形状不动', () => {
  const { HandlerWiringChecker } = require('../src/mcp/handler-wiring-check.js');
  const c = new HandlerWiringChecker(engine, null);
  const all = c.checkAll();
  assert.ok('toolWiring' in all, 'checkAll 丢了 toolWiring（加法纪律被破坏）');
  assert.ok('routeWiring' in all, 'checkAll 缺第三层 routeWiring');
  assert.ok('engineReady' in all && 'reachable' in all, 'check() 既有形状被改');
  assert.strictEqual(all.routeWiring.source, 'injected');
  assert.strictEqual(all.routeWiring.healthy, true);
  assert.strictEqual(all.routeWiring.allowed, 1305);
  assert.strictEqual(all.routeWiring.intersection, 1305);
});

test('G2 checkRoutes 注入路径与引擎路径同数字', () => {
  const { HandlerWiringChecker } = require('../src/mcp/handler-wiring-check.js');
  const c = new HandlerWiringChecker(null, null);
  const inj = c.checkRoutes({
    allowedRoutes: HeartFlow.ALLOWED_ROUTES,
    routesTable: engine.routes(),
    modules: engine._modules,
  });
  assert.strictEqual(inj.allowed, 1305);
  assert.strictEqual(inj.routesVisible, 1305);
  assert.strictEqual(inj.intersection, 1305);
  assert.strictEqual(inj.issues.length, 0);
});

test('G3 无引擎无注入 → not_provided；引擎 routes() 抛错 → probe_threw（自检不崩）', () => {
  const { HandlerWiringChecker } = require('../src/mcp/handler-wiring-check.js');
  const none = new HandlerWiringChecker(null, null).checkRoutes();
  assert.strictEqual(none.source, 'not_provided');
  assert.strictEqual(none.healthy, false);
  const broken = { started: true, _modules: {}, constructor: { ALLOWED_ROUTES: new Set(['a.b']) }, routes() { throw new Error('boom'); } };
  const threw = new HandlerWiringChecker(broken, null).checkRoutes();
  assert.strictEqual(threw.source, 'probe_threw');
  assert.strictEqual(threw.healthy, false);
  assert.ok(/boom/.test(threw.reason), 'probe_threw 要带上原始错误信息');
});

console.log('\n[H 节] 直接受影响的存量守卫逐个复跑不塌');

test('H1 round-601 / dispatch-route-integrity / round-629 复跑零失败', () => {
  const files = [
    'round-601-routes-own-methods-guard.test.js',
    'dispatch-route-integrity.test.js',
    'round-629-instructions-wiring.test.js',
  ];
  for (const f of files) {
    const out = cp.execFileSync(process.execPath, [path.join(ROOT, 'test', f)],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: ROOT });
    // 两种汇总行格式都认：「N 通过, M 失败」（多数文件）与 RESULT{json}（round-629）
    const m = out.match(/(\d+) 通过, (\d+) 失败/) || out.match(/RESULT(\{.*?\n?\})/s);
    assert.ok(m, `${f} 未输出汇总行`);
    const failed = m[2] !== undefined ? Number(m[2]) : JSON.parse(m[1]).fail;
    assert.strictEqual(failed, 0, `${f} 有 ${failed} 个失败`);
  }
});

test('H2 round-578 的 routes() 断言口径在当前源码仍成立（topicScope 无未注册标注）', () => {
  // 不整跑该文件（它构造引擎跑全量 dispatch，成本高），复刻它的断言口径：
  // !table.topicScope.includes(`topicScope.${m}  [未注册，dispatch 会拒绝]`)
  const table = engine.routes();
  const ts = (table.topicScope || []).map(String);
  assert.ok(ts.length > 0, 'topicScope 路由为空（r577 的接线不在了？）');
  assert.ok(!ts.some(r => r.includes('[未注册')), 'topicScope 仍有未注册标注');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
assert.strictEqual(fail, 0, fail + ' 项失败');
process.exit(fail > 0 ? 1 : 0);
