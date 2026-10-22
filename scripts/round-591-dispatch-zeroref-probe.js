// r591 探针：只算 MCP 可达但引擎零调用的路由
// 口径：hf.routes() 有该路由 && MCP HANDLERS 无该工具 && src/ 无字面调用点
// 这样过滤掉「只被自己模块内部 dispatch（模块名.方法）调用」的噪音
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));

function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'archive') walk(p, out); }
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

(async () => {
  const hf = new HeartFlow({ silent: true });
  await hf.start();
  let routes = [];
  for (const k of ['routes', 'getRoutes', 'listRoutes', 'allRoutes', '_routeList', 'routeList']) {
    if (typeof hf[k] === 'function') {
      try { const v = hf[k](); if (Array.isArray(v)) { routes = v; break; } } catch (e) { /* ignore */ }
    }
  }
  if (!Array.isArray(routes)) routes = [];

  // MCP 侧：已映射的工具名
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  const hIdx = srv.indexOf('const HANDLERS');
  const hBlock = srv.slice(hIdx);
  const mapped = new Set();
  let m;
  const re = /(?:^|\s)(heartflow_[a-z0-9_]+)\s*:/g;
  while ((m = re.exec(hBlock))) mapped.add(m[1]);

  const allFiles = [...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'test')), ...walk(path.join(ROOT, 'bin'))];
  const texts = allFiles.map(f => [path.relative(ROOT, f), fs.readFileSync(f, 'utf8')]);

  // 只保留「顶层子系统」级路由（第一段），因为 MCP 工具按子系统暴露
  const subsys = new Set();
  for (const r of routes) {
    if (typeof r !== 'string' || !r.includes('.')) continue;
    subsys.add(r.split('.')[0]);
  }

  // 逐子系统判断：引擎有没有 src/ 内字面调用点（模块名.方法 或 dispatch('模块')
  const orphan = [];
  for (const s of subsys) {
    const hasCall = texts.some(([rel, txt]) => rel.startsWith('src/') && txt.includes(s));
    if (!hasCall) orphan.push(s);
  }

  console.log(JSON.stringify({
    totalRoutes: routes.length,
    subsystems: subsys.size,
    mappedMcpTools: mapped.size,
    orphanSubsystemsInSrc: orphan,
  }, null, 2));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
