// r313 守卫：MCP heartflow_knowledge_layer 状态契约
// 坐实的缺口：r312 首版 handler 内 new KnowledgeLayer()，跨调用状态全丢
// （store→query count=0、remove 必 false，探针 scratch/r313-probe-mcp-kl.js）。
// 本守卫钉住「MCP 工具必须走引擎常驻实例，不许每次调用造新实例」。
'use strict';

const net = require('net');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SERVER = path.join(ROOT, 'src/mcp-server.js');
const SRC = path.join(ROOT, 'src/mcp-server.js');

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
    const timer = setTimeout(() => { s.destroy(); reject(new Error('rpc 超时')); }, 20000);
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
  for (let i = 0; i < 60; i++) {
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
    params: { name: 'heartflow_knowledge_layer', arguments: args },
  });
}

function textOf(resp) {
  try { return JSON.parse(resp.result.content[0].text); } catch (_) { return null; }
}

(async () => {
  const SOCK = '/tmp/r313-kl-guard.sock';
  let proc;
  try {
    proc = await startServer(SOCK);
  } catch (e) {
    console.log(`  ✗ A0 MCP server 启动 — ${e.message}`);
    console.log('\n第 313 轮 MCP 知识层状态契约: 0 通过, 1 失败, 共 1 个');
    process.exit(1);
  }

  try {
    // ── A 段：工具在场且描述说明与 knowledge_graph 的区别 ──
    const list = await rpcOnce(SOCK, { jsonrpc: '2.0', id: 1, method: 'tools/list' });
    const tools = (list.result && list.result.tools) || [];
    const tool = tools.find(t => t.name === 'heartflow_knowledge_layer');
    check('A1 工具在 tools/list 表内', !!tool);
    check('A2 工具描述点明与 knowledge_graph 的关系图是两回事',
      !!tool && /knowledge_graph|关系图/.test(tool.description || ''));
    check('A3 工具 inputSchema 声明 action 与 domain',
      !!tool && tool.inputSchema && tool.inputSchema.properties &&
      !!tool.inputSchema.properties.action && !!tool.inputSchema.properties.domain);

    // ── B 段：跨调用状态（本守卫存在的核心理由）──
    const DOM = 'r313guard';
    const s = textOf(await callOnce(SOCK, {
      action: 'store', domain: DOM, fact: '守卫写入的命题事实', source: 'r313', confidence: 0.9,
    }, 2));
    check('B1 store 返回 id', !!(s && s.stored && s.stored.id), JSON.stringify(s).slice(0, 120));

    const q = textOf(await callOnce(SOCK, {
      action: 'query', domain: DOM, question: '守卫 命题', limit: 10,
    }, 3));
    check('B2 同一进程内 store→query 能查到（count>=1）',
      !!(q && q.count >= 1), `count=${q && q.count}`);

    const st = textOf(await callOnce(SOCK, { action: 'stats' }, 4));
    check('B3 stats 反映已写入的事实（totalFacts>=1）',
      !!(st && st.stats && st.stats.totalFacts >= 1), `totalFacts=${st && st.stats && st.stats.totalFacts}`);

    const g = textOf(await callOnce(SOCK, { action: 'getFact', domain: DOM, id: s.stored.id }, 5));
    check('B4 getFact 按 id 取回同一事实', !!(g && g.found));

    const rm = textOf(await callOnce(SOCK, { action: 'remove', domain: DOM, id: s.stored.id }, 6));
    check('B5 remove 真的删掉（removed===true）', !!(rm && rm.removed === true));

    const q2 = textOf(await callOnce(SOCK, { action: 'query', domain: DOM, question: '守卫 命题' }, 7));
    check('B6 删除后 query 查不到（count 回 0）',
      !!(q2 && q2.count === 0), `count=${q2 && q2.count}`);

    const dom = textOf(await callOnce(SOCK, { action: 'domains' }, 8));
    check('B7 domains 返回数组', !!(dom && Array.isArray(dom.domains)));

    // ── C 段：与引擎常驻实例是同一个对象，不是另一套状态 ──
    const srcRaw = fs.readFileSync(SRC, 'utf8');
    const handlerIdx = srcRaw.indexOf('heartflow_knowledge_layer: (args)');
    const handlerSlice = handlerIdx >= 0 ? srcRaw.slice(handlerIdx, handlerIdx + 1400) : '';
    check('C1 handler 读 engine 实例（heartflow.knowledgeLayer）',
      /const kl = \(heartflow && heartflow\.knowledgeLayer\)/.test(handlerSlice));
    check('C2 handler 内不许出现 new KnowledgeLayer（r312 缺陷形态）',
      !/new KnowledgeLayer\(/.test(handlerSlice),
      handlerSlice.slice(0, 200));
    check('C3 回退单例函数存在且不在 handler 内联',
      /function _knowledgeLayerFallback\(/.test(srcRaw) &&
      !/function _knowledgeLayerFallback/.test(handlerSlice));
    // ③ 回退单例必须缓存（不带缓存就退化成「每次调用一个实例」= r312 缺陷）
    const fbIdx = srcRaw.indexOf('function _knowledgeLayerFallback()');
    const fbSlice = fbIdx >= 0 ? srcRaw.slice(fbIdx, fbIdx + 400) : '';
    check('C4 回退单例必须缓存（if (_klFallback) return _klFallback）',
      /if \(_klFallback\) return _klFallback;/.test(fbSlice),
      fbSlice.slice(0, 160));

    // ── D 段：引擎侧接线仍在（r312 的三处）──
    const hfSrc = fs.readFileSync(path.join(ROOT, 'src/core/heartflow.js'), 'utf8');
    check('D1 heartflow.js lazy 注册 _KnowledgeLayer',
      /_lazy\('knowledgeLayer'/.test(hfSrc));
    check('D2 heartflow.js start() 实例化 this.knowledgeLayer',
      /this\.knowledgeLayer = new \(_KnowledgeLayer\(\)\.KnowledgeLayer\)\(/.test(hfSrc));
    const lcSrc = fs.readFileSync(path.join(ROOT, 'src/core/engine-lifecycle.js'), 'utf8');
    check('D3 engine-lifecycle.js subsystemNames 含 knowledgeLayer',
      lcSrc.includes("'knowledgeLayer'"));

    // ── E 段：参数校验不静默吞错 ──
    const e1 = textOf(await callOnce(SOCK, { action: 'store', fact: '无域' }, 9));
    check('E1 store 缺 domain 必须报错', !!(e1 && e1.error));
    const e2 = textOf(await callOnce(SOCK, { action: 'query', question: '守卫 命题' }, 10));
    check('E2 query 缺 domain 必须报错', !!(e2 && e2.error));
    const e2b = textOf(await callOnce(SOCK, { action: 'query', domain: 'r313guard' }, 12));
    check('E2b query 空检索词必须报错（不许静默返回空结果）', !!(e2b && e2b.error));
    const e3 = textOf(await callOnce(SOCK, { action: 'remove', domain: 'x' }, 11));
    check('E3 remove 缺 id 必须报错', !!(e3 && e3.error));

    console.log(`\n第 313 轮 MCP 知识层状态契约: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
    if (failed > 0) { console.log('失败项: ' + failures.join(' | ')); process.exitCode = 1; }
  } catch (e) {
    failed++;
    console.log(`  ✗ 运行异常 — ${e.message}`);
    console.log(`\n第 313 轮 MCP 知识层状态契约: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
    process.exitCode = 1;
  } finally {
    proc.kill('SIGKILL');
    if (fs.existsSync(SOCK)) { try { fs.unlinkSync(SOCK); } catch (_) {} }
  }
})();
