// r596：对 108 个「有 handler 但未在 registry 注册」的工具做真实活性实测
// 判据：tools/call 只查 HANDLERS，registry 只影响 tools/list 发现与参数清洗。
// 所以未注册 ≠ 不可调用。这里逐个真调，看返回体是否含 error / 是否为空。
// 输出分类：LIVE(真返回结构化数据) / SHELL(返回 error 或空) / THROWS(抛异常)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MCP = fs.readFileSync(path.join(ROOT, 'src', 'mcp-server.js'), 'utf8');
const { TOOLS } = require(path.join(ROOT, 'src', 'mcp', 'tools-registry.js'));

// 与 doc-numbers-accuracy.test.js 同口径抽 HANDLERS 键
const hStart = MCP.indexOf('const HANDLERS');
const hb = MCP.slice(hStart, MCP.indexOf('\n};', hStart));
const handlerKeys = new Set();
for (const m of hb.matchAll(/^\s{2}(heartflow_[a-z0-9_]+):/gm)) handlerKeys.add(m[1]);
const reg = new Set(TOOLS.map(t => t.name));
const unreg = [...handlerKeys].filter(n => !reg.has(n));

console.log('未注册 handler 数 =', unreg.length);

// 只读工具白名单：绝不调写工具（memory_write_control / memory_eraser /
// decision_decide / self_heal 在 needsWrite 里，guest 会被拒但本地直调会真写）
const WRITE = new Set(['heartflow_memory_write_control', 'heartflow_memory_eraser',
  'heartflow_decision_decide', 'heartflow_self_heal']);
const safe = unreg.filter(n => !WRITE.has(n));
console.log('跳过写工具 =', unreg.length - safe.length, '（guest 不可调，本地直调会真写）');

// HANDLERS 不是导出符号，mcp-server.js 只在 start 时是服务端。
// 直接从源码抽 handler 函数体不可靠 → 用 spawnSync 起最小 MCP 客户端走 stdio 太慢。
// 实测方案：require mcp-server 模块本身，取其导出的 handleRequest（tools/call 路径）。
const serverPath = path.join(ROOT, 'src', 'mcp-server.js');
const srv = require(serverPath);

// 根据不同版本导出形态，找到可用的调用入口
const callTool = async (name, args) => {
  if (typeof srv.handleRequest === 'function') {
    const r = await srv.handleRequest({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
    return r;
  }
  return null;
};

// 参数猜测：registry 里没有定义，只能用各 handler 自己读的常见字段名全填一遍。
// 为了让尽量多的 handler 走到真实逻辑，给一组「广谱参数」。
const BROAD = { query: 'heartflow memory lesson', input: 'heartflow memory lesson',
  text: 'heartflow memory lesson', context: 'heartflow memory lesson', limit: 3,
  action: 'stats', filePath: 'README.md', project: 'default', provider: 'default',
  theme: 'memory', entity: 'lesson', subject: 'lesson', predicate: 'related_to', object: 'memory' };

(async () => {
const results = { LIVE: [], SHELL: [], THROWS: [], SKIP: [] };
for (const name of safe) {
  let r = null;
  try {
    r = await callTool(name, BROAD);
  } catch (e) {
    results.THROWS.push(name + ' :: ' + String(e && e.message).slice(0, 60));
    continue;
  }
  if (r === null) { results.SKIP.push(name); continue; }
  const txt = JSON.stringify(r);
  if (/"error"\s*:\s*(?!""|null|0|false)/.test(txt)) {
    results.SHELL.push(name);
  } else if (txt.length < 80 || /\{\s*\}\s*$/.test(txt)) {
    results.SHELL.push(name + ' (空体)');
  } else {
    results.LIVE.push(name);
  }
}

console.log('\n=== 实测结果 ===');
console.log('LIVE   =', results.LIVE.length);
console.log('SHELL  =', results.SHELL.length, '→', results.SHELL.slice(0, 20).join(', '));
console.log('THROWS =', results.THROWS.length, '→', results.THROWS.slice(0, 20).join(', '));
console.log('SKIP   =', results.SKIP.length);
fs.writeFileSync(path.join(__dirname, '..', 'data', 'r596-tool-liveness.json'),
  JSON.stringify(results, null, 2));
console.log('\n落盘 data/r596-tool-liveness.json');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
