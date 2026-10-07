// r593 守卫：MCP heartflow_knowledge_graph 状态契约（真三元组图跨调用可见）
// 坐实的缺口（r592 三个探针 + r593 复测）：旧 handler 每次调用
// new KnowledgeGraph({silent:true})，装饰实例与引擎零共享 —— addEdge 写进
// 一个临时 Map，下一次调用的 query/getRelated 又是另一个全新 Map，
// 外部 agent 永远只拿到全 0 stats；且 tools-registry 里从未定义该工具。
// 本守卫钉住「MCP 工具必须走引擎常驻实例 + 三处同步（定义/映射/handler）」。
'use strict';

const net = require('net');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SERVER = path.join(ROOT, 'src/mcp-server.js');
const SRC = path.join(ROOT, 'src/mcp-server.js');
const REG = path.join(ROOT, 'src/mcp/tools-registry.js');

let passed = 0, failed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; failures.push(`${name}${detail ? ' — ' + detail : ''}`); console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function rpcOnce(sock, body) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection(sock, () => { s.write(JSON.stringify(body) + '\n'); });
    let buf = '';
    const timer = setTimeout(() => { s.destroy(); reject(new Error('rpc 超时')); }, 30000);
    s.on('data', d => {
      buf += d.toString();
      const nl = buf.indexOf('\n');
      if (nl >= 0) { clearTimeout(timer); s.end(); try { resolve(JSON.parse(buf.slice(0, nl))); } catch (e) { resolve({ raw: buf.slice(0, nl) }); } }
    });
    s.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

async function startServer(sock) {
  if (fs.existsSync(sock)) fs.unlinkSync(sock);
  const proc = spawn(process.execPath, [SERVER, '--socket', sock], {
    cwd: ROOT, stdio: ['ignore', 'ignore', 'ignore'],
  });
  for (let i = 0; i < 80; i++) {
    await sleep(500);
    if (!fs.existsSync(sock)) continue;
    try {
      const r = await rpcOnce(sock, { jsonrpc: '2.0', id: 0, method: 'tools/list' });
      if (r && r.result) return proc;
    } catch (_) { /* 还没就绪 */ }
  }
  proc.kill('SIGKILL');
  throw new Error('MCP server 启动超时');
}

function callOnce(sock, args, id) {
  return rpcOnce(sock, {
    jsonrpc: '2.0', id, method: 'tools/call',
    params: { name: 'heartflow_knowledge_graph', arguments: args },
  });
}

function textOf(resp) {
  try { return JSON.parse(resp.result.content[0].text); } catch (_) { return null; }
}

(async () => {
  const SOCK = '/tmp/r593-kg-guard.sock';
  let proc;
  try {
    proc = await startServer(SOCK);
  } catch (e) {
    console.log(`  ✗ A0 MCP server 启动 — ${e.message}`);
    console.log(`\n第 593 轮 MCP 知识图谱状态契约: 0 通过, 1 失败, 共 1 个`);
    process.exit(1);
  }

  try {
    // ── A 段：三处同步（定义 / 映射 / handler）──
    const list = await rpcOnce(SOCK, { jsonrpc: '2.0', id: 1, method: 'tools/list' });
    const tools = (list.result && list.result.tools) || [];
    const tool = tools.find(t => t.name === 'heartflow_knowledge_graph');
    check('A1 工具在 tools/list 表内（此前从未有定义）', !!tool);
    check('A2 工具描述点明与 knowledge_layer 是两回事',
      !!tool && /knowledge_layer|命题库|两回事/.test(tool.description || ''));
    check('A3 inputSchema 声明 action 与 subject/entity',
      !!tool && tool.inputSchema && tool.inputSchema.properties &&
      !!tool.inputSchema.properties.action && !!tool.inputSchema.properties.subject &&
      !!tool.inputSchema.properties.entity);

    const srcRaw = fs.readFileSync(SRC, 'utf8');
    const regRaw = fs.readFileSync(REG, 'utf8');
    check('A4 mcp-server HANDLERS 有 heartflow_knowledge_graph 映射',
      /heartflow_knowledge_graph: \(args\)/.test(srcRaw));
    check('A5 tools-registry 有 heartflow_knowledge_graph 定义',
      /name:\s*['"]heartflow_knowledge_graph['"]/.test(regRaw));

    // ── B 段：跨调用状态（本守卫存在的核心理由）──
    const TAG = 'r593guard' + Date.now();
    const SUB = 'kg-' + TAG;
    const OBJ = 'node-' + TAG;

    const a = textOf(await callOnce(SOCK, {
      action: 'addEdge', subject: SUB, predicate: 'depends_on', object: OBJ, confidence: 0.9,
    }, 2));
    check('B1 addEdge 返回三元组',
      !!(a && a.triple && a.triple.subject === SUB && a.triple.object === OBJ),
      JSON.stringify(a).slice(0, 160));
    check('B2 addEdge 后图谱三元组计数增加（graphStats.triplesAdded）',
      !!(a && a.stats && a.stats.graphStats && a.stats.graphStats.triplesAdded >= 1),
      JSON.stringify(a && a.stats && a.stats.graphStats).slice(0, 160));

    const q = textOf(await callOnce(SOCK, { action: 'query', subject: SUB }, 3));
    check('B3 addEdge→query 同进程能查到（count>=1，旧实现恒 0）',
      !!(q && q.count >= 1), `count=${q && q.count}`);
    check('B4 query 返回的三元组谓词正确',
      !!(q && q.triples && q.triples[0] && q.triples[0].predicate === 'depends_on'));

    const rel = textOf(await callOnce(SOCK, { action: 'getRelated', entity: SUB }, 4));
    check('B5 getRelated 拿到关联边（含反向边）',
      !!(rel && rel.count >= 1), `count=${rel && rel.count}`);

    const ent = textOf(await callOnce(SOCK, { action: 'searchEntities', entity: TAG }, 5));
    check('B6 searchEntities 模糊检索到写入的实体',
      !!(ent && ent.count >= 2), `count=${ent && ent.count}`);

    const fp = textOf(await callOnce(SOCK, { action: 'findPath', from: SUB, to: OBJ }, 6));
    check('B7 findPath 找到 SUB→OBJ 路径（旧实现恒返 []）',
      !!(fp && fp.count >= 1), `count=${fp && fp.count}`);
    check('B7b findPath 路径节点链终点正确',
      !!(fp && fp.paths && fp.paths[0] &&
        fp.paths[0][fp.paths[0].length - 1].entity === OBJ));

    const st = textOf(await callOnce(SOCK, { action: 'stats' }, 7));
    check('B8 stats 反映真实三元组总量（graphStats.triplesAdded>0）',
      !!(st && st.stats && st.stats.graphStats && st.stats.graphStats.triplesAdded > 0),
      JSON.stringify(st && st.stats && st.stats.graphStats).slice(0, 200));

    // ── C 段：走常驻实例，不许每次 new（r312/r592 缺陷形态）──
    const handlerIdx = srcRaw.indexOf('heartflow_knowledge_graph: (args)');
    const handlerSlice = handlerIdx >= 0 ? srcRaw.slice(handlerIdx, handlerIdx + 1200) : '';
    check('C1 handler 读引擎常驻实例（heartflow.knowledge）',
      /const kg = \(heartflow && heartflow\.knowledge\)/.test(handlerSlice));
    check('C2 handler 内不许出现 new KnowledgeGraph（旧缺陷形态）',
      !/new KnowledgeGraph\(/.test(handlerSlice),
      handlerSlice.slice(0, 200));
    const fbIdx = srcRaw.indexOf('function _knowledgeGraphFallback()');
    const fbSlice = fbIdx >= 0 ? srcRaw.slice(fbIdx, fbIdx + 400) : '';
    check('C3 回退单例存在、带缓存且不在 handler 内联',
      /function _knowledgeGraphFallback\(/.test(srcRaw) &&
      /if \(_kgFallback\) return _kgFallback;/.test(fbSlice) &&
      !/function _knowledgeGraphFallback/.test(handlerSlice));
    check('C4 回退单例构造的是真 KnowledgeGraph 而非空壳',
      /require\('\.\/memory\/knowledge-graph\.js'\)/.test(fbSlice));

    // ── D 段：引擎侧常驻实例仍在 ──
    const hfSrc = fs.readFileSync(path.join(ROOT, 'src/core/heartflow.js'), 'utf8');
    check('D1 heartflow.js lazy 注册 _KnowledgeSubsystem',
      /_lazy\('knowledgeSubsystem'/.test(hfSrc));
    check('D2 heartflow.js 实例化 this.knowledge = new KnowledgeSubsystem',
      /this\.knowledge = new KnowledgeSubsystem\(/.test(hfSrc));

    // ── E 段：参数校验不静默吞错 ──
    const e1 = textOf(await callOnce(SOCK, { action: 'addEdge', subject: 'x', predicate: 'p' }, 8));
    check('E1 addEdge 缺 object 必须报错', !!(e1 && e1.error));
    const e2 = textOf(await callOnce(SOCK, { action: 'query' }, 9));
    check('E2 query 三个筛选全空必须报错（不许静默返回全表）', !!(e2 && e2.error));
    const e2b = textOf(await callOnce(SOCK, { action: 'query', predicate: 'depends_on' }, 10));
    check('E2b query 只给 predicate 合法放行', !!(e2b && !e2b.error));
    const e3 = textOf(await callOnce(SOCK, { action: 'getRelated' }, 11));
    check('E3 getRelated 缺 entity 必须报错', !!(e3 && e3.error));
    const e4 = textOf(await callOnce(SOCK, { action: 'findPath', from: 'a' }, 12));
    check('E4 findPath 缺 to 必须报错', !!(e4 && e4.error));
    const e5 = textOf(await callOnce(SOCK, { action: 'searchEntities' }, 13));
    check('E5 searchEntities 缺 entity 必须报错', !!(e5 && e5.error));

    console.log(`\n第 593 轮 MCP 知识图谱状态契约: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
    if (failed > 0) { console.log('失败项: ' + failures.join(' | ')); process.exitCode = 1; }
  } catch (e) {
    failed++;
    console.log(`  ✗ 运行异常 — ${e.message}`);
    console.log(`\n第 593 轮 MCP 知识图谱状态契约: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
    process.exitCode = 1;
  } finally {
    proc.kill('SIGKILL');
    if (fs.existsSync(SOCK)) { try { fs.unlinkSync(SOCK); } catch (_) {} }
  }
})();
