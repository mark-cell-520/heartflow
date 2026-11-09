// round-260-bridge-capability-snapshot.test.js
// [r260] 桥接层对外能力面「形状」的独立基线（r259 交接簿候选池⑪落地）
//
// 缺口（r259 修好之后新出现的结构性盲区，r259 已知未修/候选池⑪）：
//   r259 把 heartflow_bridge_status.modules 从手写清单改成由 routes() 现场派生
//   （derivePublicGroups 单一规则），三表对账发现项 2→0、verdict 恒 reconciled。
//   修得很干净，但同时「表 A ≡ 表 B」不再是发现而是**构造使然**——BridgeCapabilityChecker
//   无论跑多少遍都只会说 reconciled。于是对外能力面的形状现在只由三样东西决定：
//     ① CAPABILITY_GROUPS[].advertised（手写计数）——有哨兵（advertised_drift）；
//     ② CAPABILITY_GROUPS[].compositeMembers（手写名单）——**无哨兵**；
//     ③ derivePublicGroups 的派生规则本身——**无哨兵**。
//   ②③任一静默变化，对外承诺的能力集合就变了而没人知道——正是 r259 缺口①
//   （communicationBrief 对外不可发现）的同族复发，方向从「忘了加」变成
//   「规则改了没人看见」。
//
// 本轮落地：新模块 BridgeCapabilitySnapshot（归一化 + 落盘基线 + 逐组逐条对比）、
// HeartFlow 公开方法 bridgeCapabilitySnapshot(action)、MCP 工具
// heartflow_bridge_capability_snapshot（约定 3 三处）、data/ 下首份能力面基线。
//
// 纪律（继承 r256~r259）：轮前状态用**注入式变异**复现——归一化与对比的输入全注入，
// 喂一份被改过的基线就能复现，不需要复制 src/ 也不需要 git rev。
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
const SRC_SNAP = path.join(ROOT, 'src/core/bridge-capability-snapshot.js');
const SRC_BI = path.join(ROOT, 'src/bridge/bridge-identity.js');
const BASELINE = path.join(ROOT, 'data', 'bridge-capability-surface.json');

const { BridgeCapabilitySnapshot, normalize, SNAPSHOT_FORMAT } = require('../src/core/bridge-capability-snapshot.js');
const { CAPABILITY_GROUPS } = require('../src/bridge/bridge-identity.js');
const { HeartFlow } = require('../src/core/heartflow.js');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 注入式 fixture：与活引擎同形状，但不依赖引擎在场 ─────────────────────
const FIX_ROUTES = {
  translator: ['translator.userToLLM', 'translator.llmToUser', 'translator.communicationBrief', 'translator._hidden'],
  agentLayer: ['agentLayer.agentBridge', 'agentLayer.contextBuilder'],
  personaCore: ['personaCore.metaPosition', 'personaCore.bridgeIdentity'],
};
const FIX_ADV = [
  { group: 'translator', advertised: 3, compositeMembers: [] },
  { group: 'agentLayer', advertised: 3, compositeMembers: ['translationPipeline'] },
  { group: 'personaCore', advertised: 2, compositeMembers: [] },
];
const FIX_SURFACE = { routesTable: FIX_ROUTES, advertisedGroups: FIX_ADV };
const clone = (o) => JSON.parse(JSON.stringify(o));

// ─── 主引擎（同步 start，实测 <1s _modules 即就绪）────────────────────────
const engine = new HeartFlow({ rootPath: ROOT, silent: true });
engine.start();
const routeTable = engine.routes();
const LIVE_ADV = CAPABILITY_GROUPS.map((g) => ({
  group: g.group,
  advertised: g.advertised,
  compositeMembers: Array.isArray(g.compositeMembers) ? g.compositeMembers.slice() : [],
}));
const LIVE_SURFACE = { routesTable: routeTable, advertisedGroups: LIVE_ADV };

console.log('\n[A 节] 归一化与注入式变异（不起引擎）');

test('A1 归一化：`_` 前缀私有方法被过滤、composite 并入 methods、名单排序', () => {
  const snap = normalize(FIX_SURFACE);
  assert.strictEqual(snap.format, SNAPSHOT_FORMAT);
  assert.deepStrictEqual(snap.groupOrder, ['agentLayer', 'personaCore', 'translator'], 'groupOrder 必须排序，否则 digest 不稳定');
  assert.ok(!snap.groups.translator.methods.includes('_hidden'), '`_` 前缀私有方法不该进对外能力面');
  assert.strictEqual(snap.groups.translator.methods.length, 3, 'translator 应 3 条（4 条路由减 1 条私有）');
  assert.ok(snap.groups.agentLayer.methods.includes('translationPipeline'), 'composite 成员必须并进对外清单');
  assert.deepStrictEqual(snap.groups.agentLayer.composites, ['translationPipeline']);
  assert.strictEqual(snap.entries, 3 + 3 + 2, 'entries = 各组 methods 总数');
});

test('A2 digest 只由成员名单决定（与 routes() 元素顺序、与时间无关）', () => {
  const a = normalize(FIX_SURFACE).digest;
  const shuffled = clone(FIX_SURFACE);
  shuffled.routesTable.translator = ['translator.communicationBrief', 'translator._hidden', 'translator.llmToUser', 'translator.userToLLM'];
  const b = normalize(shuffled).digest;
  assert.strictEqual(a, b, '同一份能力面、元素顺序不同，digest 必须相同——否则跨进程对账失效');
  const snap = new BridgeCapabilitySnapshot({});
  const r1 = snap.record(FIX_SURFACE, { baselinePath: path.join(os.tmpdir(), 'r260-a2.json') });
  const r2 = snap.record(FIX_SURFACE, { baselinePath: path.join(os.tmpdir(), 'r260-a2.json') });
  assert.strictEqual(r1.digest, r2.digest, '同一份能力面两次落盘 digest 必须相同');
  const onDisk = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), 'r260-a2.json'), 'utf8'));
  assert.strictEqual(onDisk.digest, a, '落盘 digest 必须与内存归一化一致');
  assert.ok(onDisk.recordedAt, 'recordedAt 只是元信息，不许进 digest');
});

test('A3 当前比基线少一条方法 → surface_removed + healthy=false + changed=true', () => {
  const snap = new BridgeCapabilitySnapshot({});
  const base = normalize(FIX_SURFACE);
  const current = clone(FIX_SURFACE);
  current.routesTable.translator = current.routesTable.translator.filter((r) => r !== 'translator.communicationBrief');
  const r = snap.compare(current, { baseline: base });
  assert.strictEqual(r.source, 'injected');
  assert.strictEqual(r.changed, true);
  assert.strictEqual(r.healthy, false, '对外能力少了一条必须判不健康');
  assert.strictEqual(r.byKind.surface_removed, 1);
  const iss = r.issues.find((i) => i.kind === 'surface_removed');
  assert.strictEqual(iss.group, 'translator');
  assert.strictEqual(iss.method, 'communicationBrief');
  assert.strictEqual(iss.severity, 90);
  assert.strictEqual(r.digestMatch, false);
  assert.deepStrictEqual(r.kinds.surfaceRemoved, ['translator'], 'kinds 与 issues 必须同源同步');
});

test('A4 当前比基线少一整个组 → group_removed（severity 100，最重）', () => {
  const base = normalize(FIX_SURFACE);
  const current = clone(FIX_SURFACE);
  current.advertisedGroups = current.advertisedGroups.filter((g) => g.group !== 'personaCore');
  const r = new BridgeCapabilitySnapshot({}).compare(current, { baseline: base });
  assert.strictEqual(r.healthy, false);
  assert.strictEqual(r.byKind.group_removed, 1);
  const iss = r.issues.find((i) => i.kind === 'group_removed');
  assert.strictEqual(iss.group, 'personaCore');
  assert.strictEqual(iss.severity, 100);
  assert.ok(/advertised/.test(iss.detail), '必须点出 advertised 侧仍声明着这个组');
});

test('A5 当前比基线少一个 composite → composite_removed + surface_removed 双报', () => {
  const base = normalize(FIX_SURFACE);
  const current = clone(FIX_SURFACE);
  current.advertisedGroups = current.advertisedGroups.map((g) =>
    (g.group === 'agentLayer' ? Object.assign({}, g, { compositeMembers: [] }) : g));
  const r = new BridgeCapabilitySnapshot({}).compare(current, { baseline: base });
  assert.strictEqual(r.byKind.composite_removed, 1, 'composite 名单少一条必须单独报');
  assert.strictEqual(r.byKind.surface_removed, 1, 'composite 成员同时在 methods 里，也要报');
  const iss = r.issues.find((i) => i.kind === 'composite_removed');
  assert.strictEqual(iss.group, 'agentLayer');
  assert.strictEqual(iss.method, 'translationPipeline');
  assert.strictEqual(r.healthy, false, 'composite 少了也是减少类');
});

test('A6 当前比基线多一条 → surface_added + changed=true 但 healthy=true（能力变多不是缺陷）', () => {
  const base = normalize(FIX_SURFACE);
  const baseMinus = clone(base);
  baseMinus.groups.translator.methods = baseMinus.groups.translator.methods.filter((m) => m !== 'communicationBrief');
  const r = new BridgeCapabilitySnapshot({}).compare(FIX_SURFACE, { baseline: baseMinus });
  assert.strictEqual(r.changed, true, '形状变了必须能看见');
  assert.strictEqual(r.healthy, true, '能力变多不是缺陷——healthy 只由减少类决定');
  assert.strictEqual(r.byKind.surface_added, 1);
  const iss = r.issues.find((i) => i.kind === 'surface_added');
  assert.strictEqual(iss.method, 'communicationBrief');
  assert.strictEqual(iss.severity, 40);
});

test('A7 注入畸形基线 → no-baseline + baseline_format_unrecognized（不许报假 drift）', () => {
  const r = new BridgeCapabilitySnapshot({}).compare(FIX_SURFACE, { baseline: { format: 'bogus/9', groups: {} } });
  assert.strictEqual(r.source, 'no_baseline');
  assert.strictEqual(r.baselineError, 'baseline_format_unrecognized');
  assert.strictEqual(r.issues.length, 0, '没有可比基线就不许产出 drift');
  assert.strictEqual(r.healthy, false, '没测过不许报健康');
  assert.strictEqual(r.reason, 'baseline_format_unrecognized', 'reason 必须指名是基线形状不认识，不是「没有基线文件」');
  // 注入畸形基线时**不许回退到盘上**——调用方明确指定了跟谁比
  const withDisk = new BridgeCapabilitySnapshot({ baselinePath: BASELINE })
    .compare(FIX_SURFACE, { baseline: { format: 'bogus/9', groups: {} } });
  assert.strictEqual(withDisk.source, 'no_baseline', '注入的基线无效时不许静默换成盘上那份');
});

test('A8 盘上没有基线文件 → no-baseline + baseline_file_missing，绝不报 unchanged', () => {
  const missing = path.join(os.tmpdir(), 'r260-definitely-missing-' + Date.now() + '.json');
  const r = new BridgeCapabilitySnapshot({ baselinePath: missing }).compare(FIX_SURFACE);
  assert.strictEqual(r.source, 'no_baseline');
  assert.strictEqual(r.baselineError, 'baseline_file_missing');
  assert.strictEqual(r.changed, false);
  assert.strictEqual(r.healthy, false);
  const st = new BridgeCapabilitySnapshot({ baselinePath: missing }).status();
  assert.strictEqual(st.verdict, 'no-baseline');
  assert.strictEqual(st.hasBaseline, false);
});

test('A9 损坏的基线文件 → baseline_file_corrupt，不拿看不懂的文件当基线', () => {
  const p = path.join(os.tmpdir(), 'r260-corrupt.json');
  fs.writeFileSync(p, '{ not json', 'utf8');
  const r = new BridgeCapabilitySnapshot({ baselinePath: p }).compare(FIX_SURFACE);
  assert.strictEqual(r.source, 'no_baseline');
  assert.strictEqual(r.baselineError, 'baseline_file_corrupt');
  fs.unlinkSync(p);
});

test('A10 record 落盘原子写：tmp 文件不残留，内容可被 loadBaseline 读回', () => {
  const p = path.join(os.tmpdir(), 'r260-atomic.json');
  const snap = new BridgeCapabilitySnapshot({ baselinePath: p });
  const rec = snap.record(FIX_SURFACE);
  assert.strictEqual(rec.recorded, true);
  assert.ok(!fs.existsSync(p + '.tmp'), 'tmp 文件必须被 rename 掉，不许残留');
  const loaded = snap.loadBaseline();
  assert.strictEqual(loaded.baselineError, null);
  assert.strictEqual(loaded.baseline.digest, rec.digest);
  fs.unlinkSync(p);
});

console.log('\n[B 节] 活引擎端到端（bridgeCapabilitySnapshot 三段）');

test('B1 status 三段形状 + 首轮前如实报 no-baseline', () => {
  // 用一个不存在的路径验证「没有基线」那一档，不碰真基线文件
  const st = engine.bridgeCapabilitySnapshot('status', { baselinePath: path.join(os.tmpdir(), 'r260-b1-missing.json') });
  assert.strictEqual(st.action, 'status');
  assert.strictEqual(st.verdict, 'no-baseline');
  assert.strictEqual(st.matrix.hasBaseline, false);
  assert.strictEqual(st.healthy, false, '没有基线不许报健康');
  assert.strictEqual(st.reason, 'baseline_file_missing');
});

test('B2 record → compare 闭环：unchanged + digestMatch + healthy（写临时基线，不动仓库存量基线）', () => {
  const tmpBase = path.join(os.tmpdir(), 'r260-b2-baseline.json');
  try { fs.unlinkSync(tmpBase); } catch (e) { /* 本来就不在 */ }
  const rec = engine.bridgeCapabilitySnapshot('record', { baselinePath: tmpBase });
  assert.strictEqual(rec.action, 'record');
  assert.strictEqual(rec.verdict, 'recorded');
  assert.strictEqual(rec.matrix.groups, 3, '桥接能力组固定 3 组');
  assert.strictEqual(rec.matrix.entries, 24, '三组公开清单合计 24 条（9+8+7）');
  assert.strictEqual(rec.matrix.groupOrder.length, 3);
  assert.ok(/^[0-9a-f]{16}$/.test(rec.matrix.digest), 'digest 是 sha256 前 16 位十六进制');
  const cmp = engine.bridgeCapabilitySnapshot('compare', { baselinePath: tmpBase });
  assert.strictEqual(cmp.verdict, 'unchanged');
  assert.strictEqual(cmp.changed, false);
  assert.strictEqual(cmp.healthy, true);
  assert.strictEqual(cmp.matrix.digestMatch, true);
  assert.strictEqual(cmp.issues.length, 0);
  assert.strictEqual(cmp.matrix.groups, 3);
  assert.strictEqual(cmp.matrix.entries, 24);
  fs.unlinkSync(tmpBase);
});

test('B3 仓库存量基线文件形状正确 + digest 与内存归一化一致（只读，不改写）', () => {
  assert.ok(fs.existsSync(BASELINE), 'data/bridge-capability-surface.json 必须存在（.gitignore 已为例外）');
  assert.ok(!fs.existsSync(BASELINE + '.tmp'), 'tmp 不许残留');
  const onDisk = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  assert.strictEqual(onDisk.format, SNAPSHOT_FORMAT);
  assert.deepStrictEqual(Object.keys(onDisk.groups).sort(), ['agentLayer', 'personaCore', 'translator']);
  assert.strictEqual(onDisk.groups.translator.methods.length, 9, 'translator 公开清单 9 条');
  assert.ok(onDisk.groups.translator.methods.includes('communicationBrief'), 'r259 补上的那条必须在基线里');
  assert.strictEqual(onDisk.groups.agentLayer.composites.length, 1);
  assert.strictEqual(onDisk.groups.agentLayer.composites[0], 'translationPipeline');
  assert.strictEqual(onDisk.entries, 24, '三组合计 24 条');
  assert.ok(/^[0-9a-f]{16}$/.test(onDisk.digest), 'digest 形状');
  assert.ok(onDisk.recordedAt, 'recordedAt 是元信息，不许进 digest');
  // 归一化必须与 BridgeCapabilityChecker 的派生规则同口径，且 digest 跨进程稳定
  const direct = normalize(LIVE_SURFACE);
  assert.strictEqual(direct.digest, onDisk.digest, 'normalize 与活引擎 routes() 派生必须同结果——否则基线对不上当前');
  assert.strictEqual(direct.entries, 24);
  // .gitignore 必须把基线放行，否则换机 clone 后 compare 恒 no-baseline
  const gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  assert.ok(/^!data\/bridge-capability-surface\.json$/m.test(gi), '.gitignore 缺基线文件的例外规则');
});

test('B3b 仓库存量基线在 compare 下必须 unchanged（首份基线就是当前能力面）', () => {
  const cmp = engine.bridgeCapabilitySnapshot('compare');
  assert.strictEqual(cmp.verdict, 'unchanged', '首份基线与当前能力面逐条相同，却报 ' + cmp.verdict + '：' + JSON.stringify(cmp.issues).slice(0, 300));
  assert.strictEqual(cmp.healthy, true);
  assert.strictEqual(cmp.changed, false);
  assert.strictEqual(cmp.matrix.digestMatch, true);
});

test('B4 活引擎 compare 注入「少一条」的基线 → drifted + surface_added（方向：当前多）', () => {
  const base = normalize(LIVE_SURFACE);
  const mutated = clone(base);
  const dropped = mutated.groups.translator.methods.splice(0, 1)[0];
  const cmp = engine.bridgeCapabilitySnapshot('compare', { baseline: mutated });
  assert.strictEqual(cmp.verdict, 'drifted');
  assert.strictEqual(cmp.changed, true);
  assert.strictEqual(cmp.healthy, true, '这一侧是能力变多，不是减少');
  assert.strictEqual(cmp.byKind.surface_added, 1);
  const iss = cmp.issues.find((i) => i.kind === 'surface_added');
  assert.strictEqual(iss.method, dropped);
  assert.strictEqual(iss.group, 'translator');
});

test('B4b 活引擎 compare 注入「多一条」的基线 → drifted + surface_removed + healthy=false（能力真少了）', () => {
  const base = normalize(LIVE_SURFACE);
  const mutated = clone(base);
  const victim = mutated.groups.translator.methods[0];
  mutated.groups.translator.methods.push('capabilityThatNoLongerExists');
  mutated.groups.translator.methods.sort();
  const cmp = engine.bridgeCapabilitySnapshot('compare', { baseline: mutated });
  assert.strictEqual(cmp.verdict, 'drifted');
  assert.strictEqual(cmp.healthy, false, '对外能力少了一条必须判不健康');
  assert.strictEqual(cmp.byKind.surface_removed, 1);
  const iss = cmp.issues.find((i) => i.kind === 'surface_removed');
  assert.strictEqual(iss.method, 'capabilityThatNoLongerExists');
  assert.ok(/heartflow_bridge_status/.test(iss.detail), '必须点出外部调用方是按 heartflow_bridge_status 盘点能力的');
  assert.ok(victim, 'fixture 自检');
});

test('B5 bridgeCapabilityTrace 仍 reconciled（r259 三表对账未被本轮破坏）', () => {
  const t = engine.bridgeCapabilityTrace();
  assert.strictEqual(t.verdict, 'reconciled');
  assert.strictEqual(t.healthy, true);
  assert.strictEqual(t.issues.length, 0);
  assert.strictEqual(t.matrix.groups, 3);
  assert.strictEqual(t.matrix.mcpTotal, 24);
  assert.strictEqual(t.publicListSource, 'derived-from-routes()', '公开清单仍由 routes() 派生（构造使然，必须有身份标注）');
});

test('B6 未知 action 回落 compare，不抛错', () => {
  const cmp = engine.bridgeCapabilitySnapshot('nonsense');
  assert.strictEqual(cmp.action, 'compare');
  assert.ok(['unchanged', 'drifted', 'no-baseline'].includes(cmp.verdict));
});

console.log('\n[C 节] 约定 3 三处接线 + MCP 端到端');

test('C1 工具定义 / HANDLERS 映射 / handler 函数三处齐全', () => {
  const reg = fs.readFileSync(SRC_REG, 'utf8');
  assert.ok(/name:\s*'heartflow_bridge_capability_snapshot'/.test(reg), 'tools-registry 缺工具定义');
  const srv = fs.readFileSync(SRC_SRV, 'utf8');
  assert.ok(/heartflow_bridge_capability_snapshot:\s*handleBridgeCapabilitySnapshot/.test(srv), 'HANDLERS 缺映射');
  assert.ok(/function handleBridgeCapabilitySnapshot\(/.test(srv), '缺 handler 函数');
  const def = reg.match(/\{\s*name:\s*'heartflow_bridge_capability_snapshot'[\s\S]*?\n  \},/);
  assert.ok(def, '拿不到工具定义块');
  assert.ok(/inputSchema/.test(def[0]), '工具定义必须带 inputSchema');
  assert.ok(/record/.test(def[0]) && /compare/.test(def[0]) && /status/.test(def[0]), '三个 action 都要在描述里说清');
});

test('C2 不进 WRITE_TOOLS（读-only；record 只写 data/ 自己的基线文件）', () => {
  const srv = fs.readFileSync(SRC_SRV, 'utf8');
  const block = srv.match(/const WRITE_TOOLS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(block, '拿不到 WRITE_TOOLS 定义');
  assert.ok(!/heartflow_bridge_capability_snapshot/.test(block[1]), '本工具不该进写权限白名单');
});

test('C3 未就绪契约：status 不要求引擎，compare/record 要求', () => {
  const src = fs.readFileSync(SRC_SRV, 'utf8');
  const fn = src.match(/function handleBridgeCapabilitySnapshot\([\s\S]*?\n\}/);
  assert.ok(fn, '拿不到 handler 函数体');
  assert.ok(/引擎未就绪/.test(fn[0]), '未就绪必须返回可操作错误');
  assert.ok(/status 只读基线文件/.test(fn[0]), 'status 不依赖 started 引擎的理由要写在代码里');
});

test('C4 子进程端到端：tools/call 全路径跑通（token 注入避开模块层 process.exit）', () => {
  const out = cp.execFileSync(process.execPath,
    ['-e', `process.env.HEARTFLOW_MCP_TOKEN='round-260-local-test-token';process.env.HF_KEEP_STDOUT_LOGS='1';
const srv=require(${JSON.stringify(SRC_SRV)});
srv.initHeartFlow();
const st=srv.handleBridgeCapabilitySnapshot({action:'status'});
const cmp=srv.handleBridgeCapabilitySnapshot({action:'compare'});
const bad=srv.handleBridgeCapabilitySnapshot({action:'bogus'});
console.log('__R260__'+JSON.stringify({sv:st.result&&st.result.snapshot&&st.result.snapshot.verdict,cv:cmp.result&&cmp.result.snapshot&&cmp.result.snapshot.verdict,ch:cmp.result&&cmp.result.snapshot&&cmp.result.snapshot.changed,ce:cmp.error||null,be:bad.error||null,bp:JSON.stringify(bad.expectedParams||null)}));`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], cwd: ROOT, timeout: 180000, env: Object.assign({}, process.env, { HF_KEEP_STDOUT_LOGS: '1' }) });
  const r = JSON.parse(out.split('__R260__').pop().trim());
  assert.strictEqual(r.ce, null, 'compare 不该报错：' + r.ce);
  assert.ok(r.sv === 'baseline-present' || r.sv === 'no-baseline', 'status verdict 异常：' + r.sv);
  assert.ok(r.cv === 'unchanged' || r.cv === 'drifted' || r.cv === 'no-baseline', 'compare verdict 异常：' + r.cv);
  assert.strictEqual(r.be, 'unknown action: bogus');
  assert.deepStrictEqual(JSON.parse(r.bp), ['compare', 'record', 'status']);
});

test('C5 全 JSON-RPC 路径 tools/call 可调（不是只接在 HANDLERS 表里）', () => {
  const out = cp.execFileSync(process.execPath,
    ['-e', `process.env.HEARTFLOW_MCP_TOKEN='round-260-local-test-token';process.env.HF_KEEP_STDOUT_LOGS='1';
const srv=require(${JSON.stringify(SRC_SRV)});
(async()=>{ await srv.initHeartFlow();
const r=await srv.handleRequest({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'heartflow_bridge_capability_snapshot',arguments:{action:'status'}}});
const txt=r&&r.content&&r.content[0]&&r.content[0].text;
console.log('__R260__'+JSON.stringify({err:!!(r&&r.isError),ok:!!txt,v:txt?JSON.parse(txt).result.snapshot.verdict:null}));})();`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], cwd: ROOT, timeout: 180000, env: Object.assign({}, process.env, { HF_KEEP_STDOUT_LOGS: '1' }) });
  const r = JSON.parse(out.split('__R260__').pop().trim());
  assert.strictEqual(r.err, false);
  assert.ok(r.ok, 'tools/call 没返回 content');
  assert.ok(r.v === 'baseline-present' || r.v === 'no-baseline');
});

test('C6 工具总数 193→194（MCP 面记账）', () => {
  // 必须走子进程：mcp-server 模块层在没有 token 时会 process.exit(1)，
  // 在主测试进程里 require 它会把整个测试文件带走（r259 同款坑）。
  const out = cp.execFileSync(process.execPath,
    ['-e', `process.env.HEARTFLOW_MCP_TOKEN='round-260-local-test-token';process.env.HF_KEEP_STDOUT_LOGS='1';
const srv=require(${JSON.stringify(SRC_SRV)});
const w=srv.getWiring();
console.log('__R260__'+JSON.stringify({n:w.tools.length,h:w.handlerNames.length,has:w.tools.some(t=>t.name==='heartflow_bridge_capability_snapshot'),write:w.writeTools.includes('heartflow_bridge_capability_snapshot'),noAdv:w.handlerNames.filter(n=>!w.tools.map(t=>t.name).includes(n))}));`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], cwd: ROOT, timeout: 180000, env: Object.assign({}, process.env, { HF_KEEP_STDOUT_LOGS: '1' }) });
  const r = JSON.parse(out.split('__R260__').pop().trim());
  assert.strictEqual(r.n, 194, 'MCP 工具数应为 194（193→194）');
  assert.strictEqual(r.has, true, '新工具没进已广告清单');
  assert.strictEqual(r.write, false, '本工具不该进写权限白名单');
  // r255 已知未修③ 的三个 by design 未广告 handler 不许被本轮顺手改掉
  assert.deepStrictEqual(r.noAdv, ['heartflow_self_benchmark', 'heartflow_circuit_breaker', 'heartflow_safe_fetch'],
    '未广告 handler 集合变了——那是 r255 的取向裁决，不属本轮');
});

console.log('\n[D 节] 存量守卫复跑 + 结构纪律');

test('D1 round-259 桥接能力三表对账守卫零失败（本轮直接改的是它的下游）', () => {
  const out = cp.execFileSync(process.execPath, [path.join(ROOT, 'test/round-259-bridge-capability-reconcile.test.js')],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: ROOT, timeout: 180000 });
  assert.ok(!/❌/.test(out), 'round-259 有失败断言');
  assert.ok(/\d+\s*通过/.test(out), 'round-259 没输出汇总行');
});

test('D2 round-250 桥接 stub 复活守卫：唯一失败是存量 C1（探针文件缺失）', () => {
  let out = '';
  try {
    out = cp.execFileSync(process.execPath, [path.join(ROOT, 'test/round-250-bridge-stub-revival.test.js')],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: ROOT, timeout: 180000 });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const bad = out.split('\n').filter((l) => /❌/.test(l));
  assert.ok(bad.every((l) => /C1/.test(l)), 'round-250 出现非 C1 的失败：' + bad.join(' | '));
  assert.ok(/\d+\s*通过/.test(out), 'round-250 没输出汇总行');
});

test('D3 CAPABILITY_GROUPS 未被本轮改动（composite 名单仍是单一处声明）', () => {
  const src = fs.readFileSync(SRC_BI, 'utf8');
  assert.strictEqual(CAPABILITY_GROUPS.length, 3);
  const tr = CAPABILITY_GROUPS.find((g) => g.group === 'translator');
  assert.strictEqual(tr.advertised, 9, 'translator advertised 仍是 r259 修好的 9');
  assert.deepStrictEqual(tr.compositeMembers, [], 'translator composite 名单仍为空');
  const al = CAPABILITY_GROUPS.find((g) => g.group === 'agentLayer');
  assert.deepStrictEqual(al.compositeMembers, ['translationPipeline']);
  assert.strictEqual(al.advertised, 8);
  const codeLines = src.split('\n').filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//') && !l.trim().startsWith('/*'));
  assert.ok(!codeLines.some((l) => /composite:\s*\d/.test(l)), '代码里仍有手写 composite 裸计数');
});

test('D4 新模块走 lazy registry（约定 2），heartflow.js 不顶层 require 它', () => {
  const src = fs.readFileSync(SRC_HF, 'utf8');
  assert.ok(/_BridgeCapabilitySnapshot\s*=\s*_lazy\('bridgeCapabilitySnapshot'/.test(src), '缺 lazy registry 锚点');
  const head = src.split('\n').slice(0, 400).join('\n');
  assert.ok(!/^const .* = require\('\.\/bridge-capability-snapshot\.js'\)/m.test(head), '不许顶层 require Tier-2 模块');
  assert.ok(/bridgeCapabilitySnapshot\(action, opts\)/.test(src), '公开方法签名缺失');
});

test('D5 新模块非注释代码 ≥ 50 行（硬约束 #4 代码丰富口径）', () => {
  const src = fs.readFileSync(SRC_SNAP, 'utf8');
  const lines = src.split('\n').filter((l) => {
    const t = l.trim();
    return t && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
  });
  assert.ok(lines.length >= 50, `新模块非注释代码仅 ${lines.length} 行，低于 50 行门槛`);
});

test('D6 方法名不带 check 前缀（orphan-dimension-scan 纪律）', () => {
  const src = fs.readFileSync(SRC_HF, 'utf8');
  assert.ok(!/\bcheckBridgeCapabilitySnapshot\b/.test(src), '公开方法不许带 check 前缀');
  assert.ok(!/\bcheckCapabilitySnapshot\b/.test(src), '公开方法不许带 check 前缀');
});

test('D7 引擎干净启动：_modules 162 个、_initErrors 空', () => {
  assert.strictEqual(Object.keys(engine._modules || {}).length, 162, '引擎模块数应是 162');
  const errs = engine._initErrors || [];
  assert.strictEqual(errs.length, 0, '_initErrors 非空：' + JSON.stringify(errs).slice(0, 200));
});

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
