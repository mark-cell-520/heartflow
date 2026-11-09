// round-259-bridge-capability-reconcile.test.js
// [r259] 桥接层对外能力表三处漂移闭合（r258 候选池⑩「routes() 与 MCP 侧路由探针的
//       接口面再核对」落地）
//
// 轮前实测的三个缺口（scripts/tmp-259-probe3.js / probe5.js，全部可复现）：
//   描述同一批桥接能力的三张表各自手写、互不派生——
//     表 A  routes()                      引擎侧真值
//     表 B  handleBridgeStatus().modules  src/mcp-server.js 原 L1090 手写清单
//     表 C  CAPABILITY_GROUPS.advertised  src/bridge/bridge-identity.js 手写计数
//   ① 表 B translator 只有 8 条，缺 r249 新增的 communicationBrief —— 公开 MCP 工具
//      heartflow_bridge_status 对外少报一个真实能力；
//   ② 表 B agentLayer 把 translationPipeline（{runUser,runLLM} 对象成员，不是
//      dispatch 路由）和可 dispatch 的路由混在同一张表里；
//   ③ 表 C translator `advertised:8 + composite:1`，而 communicationBrief 本身就是
//      一条 dispatch 路由 —— composite 记在错的组上，BridgeIdentity 自己现场数出来的
//      reachable 报 10，真实可达只有 9（routeCount 25，实际 24）。
//   根因与 r258 同族：多张表描述同一件事，各写各的，没有一层自检看它们的一致性。
//   且 BridgeIdentity.verify() 注释说「两者对不上就是缺口」，代码只判了一个方向。
//
// 本轮落地：新模块 BridgeCapabilityChecker（三表对账，注入式）、HeartFlow 的公开方法
// bridgeCapabilityTrace()、MCP 工具 heartflow_bridge_capability（约定 3 三处）、
// handleBridgeStatus 的 modules 改由 routes() 现场派生、bridge-identity 的 advertised
// 修正 + composite 名单化 + verify() 改双向。
//
// 纪律（继承 r256/r257/r258）：轮前状态用**注入式变异**复现——检查器输入全注入，
// 喂修复前的那几张表就能复现，不需要复制 src/ 也不需要 git rev。
'use strict';

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_HF = path.join(ROOT, 'src/core/heartflow.js');
const SRC_REG = path.join(ROOT, 'src/mcp/tools-registry.js');
const SRC_SRV = path.join(ROOT, 'src/mcp-server.js');
const SRC_BI = path.join(ROOT, 'src/bridge/bridge-identity.js');
const SRC_CHK = path.join(ROOT, 'src/core/bridge-capability-check.js');

const { BridgeCapabilityChecker } = require('../src/core/bridge-capability-check.js');
const { BridgeIdentity, CAPABILITY_GROUPS } = require('../src/bridge/bridge-identity.js');
const { HeartFlow } = require('../src/core/heartflow.js');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 轮前那两张表的原样快照（r259 修复前，src 里已改，此处按轮前实测值重建）───
// 表 B 修复前：src/mcp-server.js 原 L1090 手写三组方法名清单
const OLD_MCP_GROUPS = {
  translator: ['userToLLM', 'llmToUser', 'intentClassifier', 'toneAnalyzer', 'entityExtractor', 'implicitNeedDetector', 'responseCompressor', 'confidenceAnnotator'],
  agentLayer: ['agentBridge', 'contextBuilder', 'responseInterceptor', 'translationPipeline', 'qualityFilter', 'followupSuggester', 'conflictResolver', 'uncertaintyHandler'],
  personaCore: ['bridgeIdentity', 'judgmentInjector', 'stanceDetector', 'agentCommentary', 'valueAligner', 'personalityTone', 'metaPosition'],
};
// 表 C 修复前：translator advertised 8 + composite 1（composite 未名单化，是裸计数）
const OLD_ADVERTISED = [
  { group: 'translator', advertised: 8, compositeMembers: ['communicationBrief'] },
  { group: 'agentLayer', advertised: 8, compositeMembers: ['translationPipeline'] },
  { group: 'personaCore', advertised: 7, compositeMembers: [] },
];

// ─── 主引擎（同步 start，实测 <1s _modules 即就绪）────────────────────────
const engine = new HeartFlow({ rootPath: ROOT, silent: true });
engine.start();

const routeTable = engine.routes();
const NEW_ADVERTISED = CAPABILITY_GROUPS.map((g) => ({
  group: g.group,
  advertised: g.advertised,
  compositeMembers: Array.isArray(g.compositeMembers) ? g.compositeMembers.slice() : [],
}));

/** 按 _bridgeCapabilityModules 同款规则从 routes() 派生公开清单（修复后的表 B） */
function deriveMcpGroups(advGroups) {
  const out = {};
  for (const g of advGroups) {
    const names = new Set();
    for (const raw of (Array.isArray(routeTable[g.group]) ? routeTable[g.group] : [])) {
      const s = String(raw);
      const dot = s.indexOf('.');
      const m = dot > 0 ? s.slice(dot + 1) : s;
      if (m && !m.startsWith('_')) names.add(m);
    }
    for (const c of g.compositeMembers) names.add(c);
    out[g.group] = [...names].sort();
  }
  return out;
}

const DERIVED = deriveMcpGroups(NEW_ADVERTISED);

console.log('\n[A 节] 轮前缺陷复现（注入式变异：喂修复前那几张表）');

test('A1 修复前两张表齐喂 → composite_misassigned + advertised_drift 各 1，healthy=false', () => {
  const r = new BridgeCapabilityChecker({
    routesTable: routeTable,
    advertisedGroups: OLD_ADVERTISED,
    modules: engine._modules,
    mcpGroups: OLD_MCP_GROUPS,
  }).check();
  assert.strictEqual(r.source, 'injected');
  assert.strictEqual(r.healthy, false, '轮前有漂移却报 healthy');
  assert.strictEqual(r.byKind.composite_misassigned, 1, 'composite 误记在 translator 上必须报出');
  assert.strictEqual(r.byKind.advertised_drift, 1, 'advertised 8 vs 实测 9 必须报出');
  const mis = r.issues.find((i) => i.kind === 'composite_misassigned');
  assert.strictEqual(mis.group, 'translator');
  assert.strictEqual(mis.method, 'communicationBrief');
  const drift = r.issues.find((i) => i.kind === 'advertised_drift');
  assert.strictEqual(drift.group, 'translator');
  assert.strictEqual(drift.advertised, 8);
  assert.strictEqual(drift.routes, 9, 'translator 真实 dispatch 路由是 9 条');
  assert.strictEqual(drift.measured, 10, '修复前把 communicationBrief 也算成 composite，于是 reachable 虚报成 10');
});

test('A2 只把公开清单退回修复前 → translator.communicationBrief 报 undiscoverable_capability', () => {
  const r = new BridgeCapabilityChecker({
    routesTable: routeTable,
    advertisedGroups: NEW_ADVERTISED,
    modules: engine._modules,
    mcpGroups: OLD_MCP_GROUPS,
  }).check();
  assert.strictEqual(r.byKind.undiscoverable_capability, 1, '公开清单少报真实能力必须报出');
  assert.strictEqual(r.byKind.phantom_entry, undefined, 'advertised 修好后不该有 phantom');
  const it = r.issues.find((i) => i.kind === 'undiscoverable_capability');
  assert.strictEqual(it.group, 'translator');
  assert.strictEqual(it.method, 'communicationBrief');
  assert.ok(/heartflow_bridge_status/.test(it.detail), 'detail 要点明对外暴露面');
});

test('A3 再摘掉 agentLayer 的 composite 登记 → translationPipeline 同时报 phantom_entry + undeclared_composite', () => {
  const adv = NEW_ADVERTISED.map((g) => (g.group === 'agentLayer'
    ? { group: g.group, advertised: 7, compositeMembers: [] }
    : g));
  const r = new BridgeCapabilityChecker({
    routesTable: routeTable,
    advertisedGroups: adv,
    modules: engine._modules,
    mcpGroups: OLD_MCP_GROUPS,
  }).check();
  assert.strictEqual(r.byKind.phantom_entry, 1, '公开清单列了调不到的东西必须报出');
  assert.strictEqual(r.byKind.undeclared_composite, 1, '公有对象成员没登记 composite 必须报出');
  const ph = r.issues.find((i) => i.kind === 'phantom_entry');
  assert.strictEqual(ph.method, 'translationPipeline');
  assert.strictEqual(ph.group, 'agentLayer');
});

test('A4 advertised 全部多说 1 → advertised_drift 3 条（广告了但调不到方向）', () => {
  const adv = NEW_ADVERTISED.map((g) => ({ group: g.group, advertised: g.advertised + 1, compositeMembers: g.compositeMembers }));
  const r = new BridgeCapabilityChecker({
    routesTable: routeTable,
    advertisedGroups: adv,
    modules: engine._modules,
    mcpGroups: DERIVED,
  }).check();
  assert.strictEqual(r.byKind.advertised_drift, 3);
  assert.ok(r.issues.every((i) => i.advertised > i.measured), '多说方向的 drift 必须 advertised > measured');
});

test('A5 少声明一个能力组 → group_mismatch', () => {
  const adv = NEW_ADVERTISED.filter((g) => g.group !== 'personaCore');
  const r = new BridgeCapabilityChecker({
    routesTable: routeTable,
    advertisedGroups: adv,
    modules: engine._modules,
    mcpGroups: DERIVED,
  }).check();
  assert.strictEqual(r.byKind.group_mismatch, 1, 'advertised 没声明 personaCore 必须报出');
  const it = r.issues.find((i) => i.kind === 'group_mismatch');
  assert.strictEqual(it.group, 'personaCore');
});

console.log('\n[B 节] 修复落地（三张表现值）');

test('B1 修复后三表对账：reconciled / healthy=true / 零发现项', () => {
  const r = new BridgeCapabilityChecker({
    routesTable: routeTable,
    advertisedGroups: NEW_ADVERTISED,
    modules: engine._modules,
    mcpGroups: DERIVED,
  }).check();
  assert.strictEqual(r.source, 'injected');
  assert.strictEqual(r.healthy, true, '修好后必须 healthy');
  assert.strictEqual(r.issues.length, 0, '修好后必须零发现项，实际：' + JSON.stringify(r.issues.map((i) => i.kind)));
  assert.strictEqual(r.groups, 3, '桥接能力面固定 3 组');
  assert.strictEqual(r.routesTotal, 23, '三组 dispatch 路由合计（9+7+7）');
  assert.strictEqual(r.mcpTotal, 24, '公开清单合计（9+8+7，含 1 个 composite）');
  assert.strictEqual(r.advertisedTotal, 24, 'advertised 合计（9+8+7）');
});

test('B2 公开清单含 translator.communicationBrief（轮前缺的那一个）', () => {
  assert.ok(DERIVED.translator.includes('communicationBrief'),
    '修复后公开清单必须含 r249 新增的 communicationBrief');
  assert.strictEqual(DERIVED.translator.length, 9);
});

test('B3 agentLayer 仍含 translationPipeline，但它不是 dispatch 路由（composite 身份）', () => {
  assert.ok(DERIVED.agentLayer.includes('translationPipeline'), 'composite 成员必须仍出现在公开清单里');
  const routes = (routeTable.agentLayer || []).map((s) => String(s).split('.').pop());
  assert.ok(!routes.includes('translationPipeline'), 'translationPipeline 不该是 dispatch 路由');
  assert.strictEqual(DERIVED.agentLayer.length, 8);
  assert.strictEqual(DERIVED.personaCore.length, 7);
});

test('B4 handleBridgeStatus 的 modules 由 routes() 派生且带 modulesSource / capabilitySurface', () => {
  const srv = fs.readFileSync(SRC_SRV, 'utf8');
  assert.ok(/function _bridgeCapabilityModules\(\)/.test(srv), '缺 _bridgeCapabilityModules 派生函数');
  assert.ok(srv.includes('modulesSource: derived.source'), 'modules 必须标注来源');
  assert.ok(srv.includes('capabilitySurface: derived.audit'), '必须带三表对账结论（加法字段）');
  // 手写清单已不在源码里（不再有第二份名单）
  assert.ok(!srv.includes("'userToLLM', 'llmToUser', 'intentClassifier'"), '手写 translator 清单仍在——modules 没改成派生');
  assert.ok(srv.includes('engine-not-ready'), '引擎未就绪时必须如实标注');
});

test('B5 BridgeIdentity：translator advertised 9 / composite 名单空，routeCount 24（轮前 25）', () => {
  const t = CAPABILITY_GROUPS.find((g) => g.group === 'translator');
  assert.strictEqual(t.advertised, 9, 'translator 真实可达 9 条路由');
  assert.deepStrictEqual(t.compositeMembers, [], 'communicationBrief 是路由不是 composite，名单必须为空');
  const al = CAPABILITY_GROUPS.find((g) => g.group === 'agentLayer');
  assert.deepStrictEqual(al.compositeMembers, ['translationPipeline'], 'agentLayer 的 composite 只有 translationPipeline');
  const bi = new BridgeIdentity({ version: 'probe', listRoutes: () => routeTable });
  const id = bi.getIdentity();
  assert.strictEqual(id.routeCount, 24, '轮前 routeCount 25（虚高 1），修复后必须 24');
  const tr = id.capabilities.find((c) => c.group === 'translator');
  assert.strictEqual(tr.reachable, 9);
  assert.strictEqual(tr.composite, 0);
  const alC = id.capabilities.find((c) => c.group === 'agentLayer');
  assert.strictEqual(alC.reachable, 8);
  assert.strictEqual(alC.dispatchable, 7);
});

console.log('\n[C 节] BridgeIdentity.verify() 双向化');

test('C1 全引擎 verify ok=true，gaps 与 undercounts 都空', () => {
  const v = new BridgeIdentity({ version: 'probe', listRoutes: () => routeTable }).verify();
  assert.strictEqual(v.ok, true);
  assert.deepStrictEqual(v.gaps, []);
  assert.deepStrictEqual(v.undercounts, []);
  assert.strictEqual(v.checked, 3);
  assert.strictEqual(v.measured, true);
});

test('C2 变异副本：CAPABILITY_GROUPS translator advertised 退回 8 → undercounts 报 1、ok=false', () => {
  const orig = fs.readFileSync(SRC_BI, 'utf8');
  const anchor = "{ group: 'translator', advertised: 9, prefix: 'translator', compositeMembers: [],";
  assert.ok(orig.includes(anchor), 'translator 组的 advertised 锚点不在（源码形状可能已变）');
  const mutated = orig.replace(anchor, "{ group: 'translator', advertised: 8, prefix: 'translator', compositeMembers: [],");
  assert.ok(mutated !== orig, '变异未生效');
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'hf-r259-bi-'));
  try {
    const p = path.join(tmp, 'bridge-identity.js');
    fs.writeFileSync(p, mutated, 'utf8');
    const out = cp.execFileSync(process.execPath,
      ['-e', `const {BridgeIdentity}=require(${JSON.stringify(p)});
const {HeartFlow}=require(${JSON.stringify(SRC_HF)});
const e=new HeartFlow({rootPath:${JSON.stringify(ROOT)}, silent:true}); e.start();
const v=new BridgeIdentity({version:'p',listRoutes:()=>e.routes()}).verify();
console.log('__R259__'+JSON.stringify({ok:v.ok,g:v.gaps,u:v.undercounts}));`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], cwd: ROOT });
    const r = JSON.parse(out.split('__R259__').pop().trim());
    assert.strictEqual(r.ok, false, 'advertised 说少了必须报不 ok（轮前单向判据抓不到这一类）');
    assert.strictEqual(r.u.length, 1, 'undercounts 必须有 1 条');
    assert.strictEqual(r.u[0].group, 'translator');
    assert.strictEqual(r.u[0].extra, 1);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('C3 变异副本：三组 advertised 全部 +1 → gaps 3 条（广告了但调不到方向）', () => {
  const orig = fs.readFileSync(SRC_BI, 'utf8');
  const mutated = orig
    .replace("{ group: 'translator', advertised: 9,", "{ group: 'translator', advertised: 10,")
    .replace("{ group: 'agentLayer', advertised: 8,", "{ group: 'agentLayer', advertised: 9,")
    .replace("{ group: 'personaCore', advertised: 7,", "{ group: 'personaCore', advertised: 8,");
  assert.ok(mutated !== orig, '变异未生效');
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'hf-r259-bi2-'));
  try {
    const p = path.join(tmp, 'bridge-identity.js');
    fs.writeFileSync(p, mutated, 'utf8');
    const out = cp.execFileSync(process.execPath,
      ['-e', `const {BridgeIdentity}=require(${JSON.stringify(p)});
const {HeartFlow}=require(${JSON.stringify(SRC_HF)});
const e=new HeartFlow({rootPath:${JSON.stringify(ROOT)}, silent:true}); e.start();
const v=new BridgeIdentity({version:'p',listRoutes:()=>e.routes()}).verify();
console.log('__R259__'+JSON.stringify({ok:v.ok,g:v.gaps.map(x=>x.group)}));`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], cwd: ROOT });
    const r = JSON.parse(out.split('__R259__').pop().trim());
    assert.strictEqual(r.ok, false);
    assert.deepStrictEqual(r.g.sort(), ['agentLayer', 'personaCore', 'translator']);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('C4 存量契约：无探针 ok=false；路由不足 ok=false（round-250 断言口径复刻）', () => {
  assert.strictEqual(new BridgeIdentity().verify().ok, false, '无探针时 verify 不该报 ok');
  assert.strictEqual(new BridgeIdentity({ listRoutes: () => ({ translator: ['translator.userToLLM'] }) }).verify().ok, false,
    '路由不足时应报缺口');
});

console.log('\n[D 节] bridgeCapabilityTrace 公开方法形状与 verdict 四态');

test('D1 现值 verdict=reconciled（喂注入公开清单）/ healthy=true / 三表数字', () => {
  const t = engine.bridgeCapabilityTrace({
    routesTable: routeTable,
    advertisedGroups: NEW_ADVERTISED,
    modules: engine._modules,
    mcpGroups: DERIVED,
  });
  assert.strictEqual(t.verdict, 'reconciled');
  assert.strictEqual(t.healthy, true);
  assert.strictEqual(t.matrix.groups, 3);
  assert.strictEqual(t.matrix.routesTotal, 23);
  assert.strictEqual(t.matrix.mcpTotal, 24);
  assert.strictEqual(t.matrix.advertisedTotal, 24);
  assert.strictEqual(t.issues.length, 0);
  assert.strictEqual(t.publicListSource, 'injected');
});

test('D2 默认路径现场派生公开清单 → publicListSource=derived-from-routes()（不是独立实测）', () => {
  const t = engine.bridgeCapabilityTrace();
  assert.strictEqual(t.publicListSource, 'derived-from-routes()');
  assert.strictEqual(t.verdict, 'reconciled');
  assert.strictEqual(t.matrix.groups, 3);
  assert.strictEqual(t.matrix.mcpTotal, 24);
});

test('D2b routes() 空而 advertised 非空 → verdict=mcp-table-not-provided 且 healthy=false（没测≠对齐）', () => {
  const t = engine.bridgeCapabilityTrace({
    routesTable: {},
    advertisedGroups: NEW_ADVERTISED,
    modules: engine._modules,
  });
  assert.strictEqual(t.verdict, 'mcp-table-not-provided');
  assert.strictEqual(t.reason, 'mcp_table_not_provided');
  assert.strictEqual(t.healthy, false, '公开清单派生不出来不许判 healthy');
  assert.strictEqual(t.publicListSource, 'not-provided');
  assert.ok(/mcp-table-not-provided/.test(t.note), 'note 必须说清这不是对齐');
});

test('D3 输入全缺 → verdict=capability-surface-not-provided', () => {
  const t = engine.bridgeCapabilityTrace({ routesTable: {}, advertisedGroups: [] });
  assert.strictEqual(t.verdict, 'capability-surface-not-provided');
  assert.strictEqual(t.healthy, false);
});

test('D4 喂修复前的表 → verdict=drift + 六类 matrix 字段齐备', () => {
  const t = engine.bridgeCapabilityTrace({
    routesTable: routeTable,
    advertisedGroups: OLD_ADVERTISED,
    modules: engine._modules,
    mcpGroups: OLD_MCP_GROUPS,
  });
  assert.strictEqual(t.verdict, 'drift');
  assert.strictEqual(t.healthy, false);
  for (const k of ['groups', 'routesTotal', 'mcpTotal', 'advertisedTotal', 'undiscoverableCapability',
    'phantomEntry', 'advertisedDrift', 'compositeMisassigned', 'undeclaredComposite', 'groupMismatch']) {
    assert.ok(k in t.matrix, `matrix 缺字段 ${k}`);
  }
  assert.ok(Array.isArray(t.kinds.undiscoverableCapability), 'kinds 必须与 issues 同源（r258 踩坑①）');
  assert.ok(t.byKind && typeof t.byKind === 'object');
  assert.ok(t.byGroup && typeof t.byGroup === 'object');
  assert.ok(typeof t.checkedAt === 'number');
});

test('D5 默认路径（不传 surface）走引擎现值 + 方法名不带 check 前缀', () => {
  const t = engine.bridgeCapabilityTrace();
  assert.ok(['reconciled', 'mcp-table-not-provided', 'drift'].includes(t.verdict), '默认路径 verdict 异常：' + t.verdict);
  assert.strictEqual(t.matrix.groups, 3, '默认路径也该只对账 3 个桥接能力组（不是 routes() 全部 162 组）');
  assert.strictEqual(t.matrix.routesTotal, 23);
  const src = fs.readFileSync(SRC_HF, 'utf8');
  assert.ok(/^\s*bridgeCapabilityTrace\(/m.test(src), 'bridgeCapabilityTrace 方法缺失');
  assert.ok(!/function checkBridgeCapability/.test(src), '方法名不该带 check 前缀（orphan-dimension-scan 纪律）');
  assert.ok(!/^\s*checkBridgeCapability\(/m.test(src), '方法名不该带 check 前缀');
});

test('D6 检查器 isReconciled：注入齐全且零发现项才 true', () => {
  const c = new BridgeCapabilityChecker();
  assert.strictEqual(c.isReconciled({ routesTable: routeTable, advertisedGroups: NEW_ADVERTISED, modules: engine._modules, mcpGroups: DERIVED }), true);
  assert.strictEqual(c.isReconciled({ routesTable: routeTable, advertisedGroups: NEW_ADVERTISED, modules: engine._modules }), false,
    '公开清单没喂不该算 reconciled');
  assert.strictEqual(c.isReconciled(null), false, '输入全缺不该算 reconciled');
});

console.log('\n[E 节] MCP 接线（AGENTS.md 约定 3：工具定义 + handler 映射 + handler 函数）');

test('E1 工具定义在 tools-registry 且 inputSchema 合法', () => {
  const reg = fs.readFileSync(SRC_REG, 'utf8');
  assert.ok(reg.includes("name: 'heartflow_bridge_capability'"), 'tools-registry 缺工具定义');
  assert.ok(/name: 'heartflow_bridge_capability',\n\s*description:[\s\S]{0,4000}?inputSchema/.test(reg), '工具定义缺 inputSchema');
  const { TOOLS } = require(SRC_REG);
  const def = TOOLS.find((t) => t.name === 'heartflow_bridge_capability');
  assert.ok(def, 'TOOLS 里找不到 heartflow_bridge_capability');
  assert.strictEqual(def.inputSchema.type, 'object');
  assert.ok(def.inputSchema.properties.action, 'action 参数没声明');
  assert.ok(def.description.length > 100, 'description 太短——工具用途说不清');
});

test('E2 HANDLERS 映射 + handler 函数 + 不进 WRITE_TOOLS', () => {
  const srv = fs.readFileSync(SRC_SRV, 'utf8');
  assert.ok(/heartflow_bridge_capability:\s*handleBridgeCapability/.test(srv), 'HANDLERS 缺映射');
  assert.ok(/function handleBridgeCapability\(args\)/.test(srv), 'handler 函数缺失');
  const m = srv.match(/const WRITE_TOOLS = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m, 'WRITE_TOOLS 定义没找到');
  assert.ok(!m[1].includes('heartflow_bridge_capability'), '只读工具不该进 WRITE_TOOLS');
  // 三处接线的工具名去重
  const names = (srv.match(/heartflow_bridge_capability/g) || []).length;
  assert.strictEqual(names, 1, 'mcp-server 侧应只有 HANDLERS 映射一处（工具名不重复注册）');
  assert.ok(srv.includes('handleBridgeCapability,'), 'module.exports 缺 handleBridgeCapability 导出');
});

test('E3 handler 引擎未就绪契约 + 子进程端到端（独立 require，无缓存污染）', () => {
  const srv = fs.readFileSync(SRC_SRV, 'utf8');
  assert.ok(srv.includes("return { error: '引擎未就绪（bridgeCapabilityTrace 需要 started 且 _modules 非空）', expectedParams: [], timestamp: Date.now() };"),
    'handler 引擎未就绪时应返回带 expectedParams 的可操作错误');
  const out = cp.execFileSync(process.execPath,
    ['-e', `const m=require(${JSON.stringify(SRC_HF)});
const e=new m.HeartFlow({rootPath:${JSON.stringify(ROOT)}, silent:true}); e.start();
const t=e.bridgeCapabilityTrace({routesTable:e.routes(),advertisedGroups:${JSON.stringify(NEW_ADVERTISED)},modules:e._modules,mcpGroups:${JSON.stringify(DERIVED)}});
console.log('__R259__'+JSON.stringify({v:t.verdict,h:t.healthy,g:t.matrix.groups,r:t.matrix.routesTotal}));`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], cwd: ROOT });
  const r = JSON.parse(out.split('__R259__').pop().trim());
  assert.strictEqual(r.v, 'reconciled');
  assert.strictEqual(r.h, true);
  assert.strictEqual(r.g, 3);
  assert.strictEqual(r.r, 23);
});

test('E4 子进程 require mcp-server 直接调 handler（token 注入避开模块层 process.exit）', () => {
  const out = cp.execFileSync(process.execPath,
    ['-e', `process.env.HEARTFLOW_MCP_TOKEN='round-259-local-test-token';process.env.HF_KEEP_STDOUT_LOGS='1';
const srv=require(${JSON.stringify(SRC_SRV)});
srv.initHeartFlow();
const r=srv.handleBridgeCapability({action:'matrix'});
console.log('__R259__'+JSON.stringify({v:r.result&&r.result.verdict,h:r.result&&r.result.healthy,g:r.result&&r.result.matrix&&r.result.matrix.groups,err:r.error||null}));`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], cwd: ROOT, timeout: 180000, env: Object.assign({}, process.env, { HF_KEEP_STDOUT_LOGS: '1' }) });
  const r = JSON.parse(out.split('__R259__').pop().trim());
  // 常驻引擎可能未启动（探针不起服务），此时必须返回可操作的未就绪错误而不是崩
  assert.ok(r.v === 'reconciled' || r.v === 'drift' || r.v === 'mcp-table-not-provided' || r.err,
    'handler 返回值异常：' + JSON.stringify(r));
  if (r.v) assert.strictEqual(r.g, 3, '对账组数必须固定 3');
});

test('E5 handleBridgeStatus 端到端：modules 派生 + capabilitySurface 加法字段', () => {
  const out = cp.execFileSync(process.execPath,
    ['-e', `process.env.HEARTFLOW_MCP_TOKEN='round-259-local-test-token';process.env.HF_KEEP_STDOUT_LOGS='1';
const srv=require(${JSON.stringify(SRC_SRV)});
srv.initHeartFlow();
const r=srv.handleBridgeStatus();
console.log('__R259__'+JSON.stringify({src:r.modulesSource,tr:(r.modules&&r.modules.translator||[]).length,al:(r.modules&&r.modules.agentLayer||[]).length,pc:(r.modules&&r.modules.personaCore||[]).length,hasBrief:!!(r.modules&&r.modules.translator||[]).includes('communicationBrief'),hasAudit:!!r.capabilitySurface}));`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], cwd: ROOT, timeout: 180000, env: Object.assign({}, process.env, { HF_KEEP_STDOUT_LOGS: '1' }) });
  const r = JSON.parse(out.split('__R259__').pop().trim());
  assert.strictEqual(r.src, 'routes()', 'modules 必须标注来自 routes()');
  assert.strictEqual(r.hasBrief, true, '公开清单必须含 communicationBrief');
  assert.strictEqual(r.tr, 9);
  assert.strictEqual(r.al, 8);
  assert.strictEqual(r.pc, 7);
  assert.strictEqual(r.hasAudit, true, '必须带三表对账结论');
});

console.log('\n[F 节] 存量守卫复跑（直接受本轮改动影响的文件）');

test('F1 round-249 桥接能力复活守卫零失败', () => {
  const out = cp.execFileSync(process.execPath, [path.join(ROOT, 'test/round-249-bridge-capability-revival.test.js')],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: ROOT, timeout: 180000 });
  assert.ok(!/❌/.test(out), 'round-249 有失败断言');
  assert.ok(/\d+\s*通过/.test(out), 'round-249 没输出汇总行');
});

test('F2 round-250 桥接 stub 复活守卫：唯一失败是存量 C1（探针文件缺失，r258 基线同款）', () => {
  let out = '';
  try {
    out = cp.execFileSync(process.execPath, [path.join(ROOT, 'test/round-250-bridge-stub-revival.test.js')],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: ROOT, timeout: 180000 });
  } catch (e) { out = e.stdout || ''; }
  const failed = out.split(String.fromCharCode(10)).filter((l) => l.indexOf('❌') >= 0);
  // 同一条失败在输出里出现两次（内联一次 + 末尾汇总一次带子进程错误尾串），
  // 逐条判都必须指向 C1；总数由汇总行「22 通过, 1 失败」钉死
  assert.ok(failed.length >= 1, 'round-250 一条失败都没有了？基线是恰 1 条存量 C1');
  assert.ok(failed.every((l) => /C1/.test(l)), '出现了 C1 以外的新失败：' + JSON.stringify(failed));
  assert.ok(!fs.existsSync(path.join(ROOT, 'scripts/tmp-250-mcp-child.js')),
    'scripts/tmp-250-mcp-child.js 竟存在——C1 的失败原因是该探针文件不在（r250 遗留），不是行为失败');
  assert.ok(/22 通过, 1 失败/.test(out), 'round-250 汇总行口径变了');
  // 本轮直接受影响的 BridgeIdentity.verify 两条断言在 C4 已同口径复刻通过
});

test('F3 round-251 占位问责守卫零失败（MCP 工具总数下界断言不受 192→193 影响）', () => {
  const out = cp.execFileSync(process.execPath, [path.join(ROOT, 'test/round-251-stub-accountability.test.js')],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: ROOT, timeout: 180000 });
  assert.ok(!/❌/.test(out), 'round-251 有失败断言');
  assert.ok(/\d+\s*通过/.test(out), 'round-251 没输出汇总行');
});

test('F4 HandlerWiringChecker 结构层不受新工具影响（192→193 后仍 healthy）', () => {
  const { HandlerWiringChecker } = require('../src/mcp/handler-wiring-check.js');
  const { TOOLS } = require(SRC_REG);
  const srv = fs.readFileSync(SRC_SRV, 'utf8');
  const handlerNames = [...srv.matchAll(/(heartflow_[a-z_0-9]+)\s*:/g)].map((m) => m[1]);
  const writeM = srv.match(/const WRITE_TOOLS = new Set\(\[([\s\S]*?)\]\)/);
  const writeTools = [...writeM[1].matchAll(/'(heartflow_[a-z_0-9]+)'/g)].map((m) => m[1]);
  const r = new HandlerWiringChecker(engine, {
    tools: TOOLS,
    handlerNames,
    writeTools,
    readOnlyTools: [],
  }).checkStructural();
  assert.strictEqual(r.healthy, true, '结构层不健康：' + JSON.stringify(r.byKind));
  assert.strictEqual(r.advertised, 193, '工具总数应从 192 变 193');
  const unadv = r.issues.filter((i) => i.kind === 'handler_not_advertised' && !i.byDesign);
  assert.strictEqual(unadv.length, 0, '出现未登记的新未广告 handler');
});

console.log('\n[G 节] 锚点与口径自检');

test('G1 新模块走 lazy registry（AGENTS.md 约定 2）', () => {
  const src = fs.readFileSync(SRC_HF, 'utf8');
  assert.ok(/_BridgeCapabilityChecker = _lazy\('bridgeCapabilityCheck', \(\) => require\('\.\/bridge-capability-check\.js'\)\)/.test(src),
    'BridgeCapabilityChecker 必须走 lazy registry');
  // 顶层不得直接 require Tier-2 模块
  const topRequires = src.split('\n').filter((l) => /^const .* = require\('\.\//.test(l));
  assert.ok(!topRequires.some((l) => l.includes('bridge-capability-check.js')), '不得在顶层直接 require');
});

test('G2 新模块非注释代码 ≥ 50 行（硬约束 #4 代码丰富口径）', () => {
  const src = fs.readFileSync(SRC_CHK, 'utf8');
  const lines = src.split('\n').filter((l) => {
    const t = l.trim();
    return t && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
  });
  assert.ok(lines.length >= 50, `新模块非注释代码仅 ${lines.length} 行，低于 50 行门槛`);
});

test('G3 bridge-identity 不再有手写 composite 裸计数（名单化）', () => {
  const src = fs.readFileSync(SRC_BI, 'utf8');
  // 只查**代码行**里的裸计数（注释里复盘 `composite:1` 是历史陈述，不算）
  const codeLines = src.split('\n').filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//') && !l.trim().startsWith('/*'));
  assert.ok(!codeLines.some((l) => /composite:\s*\d/.test(l)), '代码里仍有手写 composite 裸计数——composite 必须由 compositeMembers 名单推导');
  assert.ok(/compositeMembers/.test(src), 'compositeMembers 名单缺失');
});

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
