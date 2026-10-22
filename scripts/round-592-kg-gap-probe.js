/**
 * r592 缺口复测：heartflow_knowledge_graph 现状是否「坏接线」
 * 只跑一次，输出数字，不贴样本原文。
 */
const net = require('net');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(ROOT, 'src');
const SOCK = path.join(os.tmpdir(), `hf-kg-r592-${process.pid}.sock`);

function mcpCall(name, args, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection(SOCK, () => {
      s.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) + '\n');
    });
    let buf = '';
    const timer = setTimeout(() => { s.destroy(); reject(new Error('timeout ' + name)); }, timeoutMs);
    s.on('data', d => {
      buf += d.toString();
      if (buf.includes('\n')) {
        clearTimeout(timer);
        try { resolve(JSON.parse(buf.trim())); } catch (e) { reject(e); }
        s.destroy();
      }
    });
    s.on('error', e => { clearTimeout(timer); reject(e); });
  });
}
function payload(res) {
  const r = res && (res.result || res);
  const text = r && r.content && r.content[0] ? r.content[0].text : '';
  try { return JSON.parse(text); } catch (_) { return { __raw: text }; }
}

try { fs.unlinkSync(SOCK); } catch (_) {}
const proc = spawn('node', [path.join(SRC, 'mcp-server.js'), '--socket', SOCK], { cwd: ROOT, stdio: ['ignore', 'ignore', 'ignore'] });

(async () => {
  const deadline = Date.now() + 40000;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) throw new Error(`MCP 退出 code=${proc.exitCode}`);
    if (fs.existsSync(SOCK)) { await new Promise(r => setTimeout(r, 1500)); break; }
    await new Promise(r => setTimeout(r, 250));
  }
  if (!fs.existsSync(SOCK)) throw new Error('socket 未就绪');

  const list = payload(await mcpCall('tools/list', {}));
  const names = (list.tools || []).map(t => t.name);
  console.log(JSON.stringify({
    toolCount: names.length,
    hasKnowledgeGraphDef: names.includes('heartflow_knowledge_graph'),
  }, null, 2));

  // addEdge 之后 query：坏接线下每次 new，query 必然 count=0
  const q1 = payload(await mcpCall('heartflow_knowledge_graph', { action: 'addEdge', subject: 'A', predicate: 'r', object: 'B' }));
  const q2 = payload(await mcpCall('heartflow_knowledge_graph', { action: 'query', subject: 'A' }));
  console.log(JSON.stringify({
    addEdgeResult: q1,
    queryCount: q2 && typeof q2.count === 'number' ? q2.count : (q2 && q2.__raw ? 'RAW:' + q2.__raw.slice(0, 120) : JSON.stringify(q2).slice(0, 160)),
  }, null, 2));

  // getRelated / findPath / searchEntities 当前是否可用
  const g = payload(await mcpCall('heartflow_knowledge_graph', { action: 'getRelated', entity: 'A' }));
  console.log(JSON.stringify({ getRelated: g }, null, 2));
})().catch(e => console.log('PROBE_ERR ' + e.message)).then(() => {
  try { proc.kill(); } catch (_) {}
  try { fs.unlinkSync(SOCK); } catch (_) {}
});
