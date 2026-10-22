// r591 探针（精确版）：引擎子系统 vs MCP 工具的覆盖差
// 三信号判定「该子系统是否已被 MCP 暴露」：
//   ① path：HANDLERS 里有段 require 了该模块文件路径
//   ② name：HANDLERS 键名 snake 化后与该子系统名匹配
//   ③ text：mcp-server.js 全文出现该子系统 camel 名
// 只报数字与子系统名，不贴样本原文
'use strict';
const fs = require('fs');
const path = require('path');
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

  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  const hIdx = srv.indexOf('const HANDLERS');
  const hBlock = srv.slice(hIdx);

  const handledKeys = new Set();
  let m;
  const re = /(?:^|\s)(heartflow_[a-z0-9_]+)\s*:/g;
  while ((m = re.exec(hBlock))) handledKeys.add(m[1]);

  // 已启动引擎惰性注册表：key -> 相对 src 的模块路径
  const lazyPaths = {};
  for (const f of [path.join(ROOT, 'src/core/heartflow.js')]) {
    const txt = fs.readFileSync(f, 'utf8');
    const re2 = /_lazy\(\s*'([a-zA-Z0-9_]+)'\s*,\s*\(\)\s*=>\s*(?:try\s*\{\s*)?require\('([^']+)'\)/g;
    while ((m = re2.exec(txt))) lazyPaths[m[1]] = m[2];
  }

  const mods = hf._modules || {};
  const unexposed = [];
  const exposed = [];
  for (const [name, mod] of Object.entries(mods)) {
    let methods = [];
    try {
      const proto = Object.getPrototypeOf(mod);
      if (proto && proto !== Object.prototype) {
        methods = Object.getOwnPropertyNames(proto).filter(x => x !== 'constructor' && typeof mod[x] === 'function');
      }
    } catch (e) { /* ignore */ }
    if (!methods.length) methods = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    if (!methods.length) continue;

    const rel = lazyPaths[name] || null; // e.g. '../cortex/reflexion-engine.js'
    const byPath = rel ? hBlock.includes(`'${rel}'`) || hBlock.includes(`"${rel}"`) : false;
    const snake = 'heartflow_' + name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    const byName = handledKeys.has(snake) || handledKeys.has('heartflow_' + name.toLowerCase());
    const byText = srv.includes(name);
    if (!byPath && !byName && !byText) unexposed.push({ name, rel, methodCount: methods.length, methods: methods.slice(0, 20) });
    else exposed.push({ name, rel, methodCount: methods.length, byPath, byName, byText });
  }

  // 打印：只留真正未暴露
  console.log(JSON.stringify({
    totalModules: Object.keys(mods).length,
    exposed: exposed.length,
    unexposed: unexposed.length,
    unexposedList: unexposed.map(u => ({ name: u.name, rel: u.rel, methodCount: u.methodCount })),
    unexposedDetail: unexposed.map(u => ({ name: u.name, rel: u.rel, methods: u.methods })),
  }, null, 2));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
