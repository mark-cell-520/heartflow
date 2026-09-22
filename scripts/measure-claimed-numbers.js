#!/usr/bin/env node
/** 实测全部对外宣称的数字（v6.7.77） */
const fs = require('fs');
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';

const idx = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
const reg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');

// 1. check 函数数（维度）
const checkFns = new Set();
for (const m of idx.matchAll(/^function (check[A-Z]\w*)\s*\(/gm)) checkFns.add(m[1]);

// 2. BLOCK/REWRITE/VERIFY 集合大小
const cnt = label => {
  const m = idx.match(new RegExp(`const ${label} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  if (!m) return 0;
  return m[1].match(/['"][a-z_]+['"]/g)?.length || 0;
};

// 3. MCP 工具数（tools/list 真实值）
let mcpTools = 0;
{
  const names = new Set();
  for (const m of reg.matchAll(/name:\s*['"](heartflow_[a-z0-9_]+)['"]/g)) names.add(m[1]);
  mcpTools = names.size;
}

// 4. HANDLERS 键数
let handlers = 0;
{
  const hStart = srv.indexOf('const HANDLERS');
  const hEnd = srv.indexOf('\n};', hStart);
  const hb = srv.slice(hStart, hEnd);
  const keys = new Set();
  for (const m of hb.matchAll(/^\s{2}(heartflow_[a-z0-9_]+):/gm)) keys.add(m[1]);
  handlers = keys.size;
}

// 5. dispatch 路由数（运行时真实值，不是静态种子）
//    1129 行的 static ALLOWED_ROUTES 只是 35 条种子，4245 行
//    generateAllowedRoutes(this._modules) 在 start() 时动态生成全部。
let routes = 0;
{
  const cp = require('child_process');
  const r = cp.spawnSync('node', ['-e', `
    const path=require('path');
    const {HeartFlow}=require('${path.join(ROOT, 'src/core/heartflow.js')}');
    const hf=new HeartFlow({dataDir:'${path.join(ROOT, 'data')}',silent:true});
    hf.start();
    setTimeout(()=>{ console.log(HeartFlow.ALLOWED_ROUTES.size); process.exit(0); }, 4000);
  `], { encoding: 'utf8', timeout: 60000 });
  routes = parseInt((r.stdout || '').trim().split('\n').pop(), 10) || 0;
}

// 6. 模块数（_modules 注册）
let modules = 0;
try {
  const cp = require('child_process');
  const r = cp.spawnSync('node', ['-e', `
    const path=require('path');
    const {HeartFlow}=require('${path.join(ROOT, 'src/core/heartflow.js')}');
    const hf=new HeartFlow({dataDir:'${path.join(ROOT, 'data')}',silent:true});
    hf.start();
    setTimeout(()=>{ console.log(Object.keys(hf._modules||{}).length); process.exit(0); }, 4000);
  `], { encoding: 'utf8', timeout: 60000 });
  modules = parseInt((r.stdout || '').trim().split('\n').pop(), 10) || 0;
} catch (_) {}

// 7. 测试数
let tests = 0;
{
  const ra = fs.readFileSync(path.join(ROOT, 'test/run-all.js'), 'utf8');
  // 不跑全量，只数测试文件
  const walk = d => fs.readdirSync(d, { withFileTypes: true })
    .flatMap(e => e.isDirectory() ? walk(path.join(d, e.name))
      : (e.name.endsWith('.test.js') || e.name.endsWith('-test.js') ? [e.name] : []));
  tests = walk(path.join(ROOT, 'test')).length;
}

// 8. src 文件数
let srcFiles = 0;
{
  const walk = d => fs.readdirSync(d, { withFileTypes: true })
    .flatMap(e => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (['node_modules', '.git', 'archive', 'data', 'models', 'formulas-corpus', 'dict-data'].includes(e.name)) return [];
        return walk(p);
      }
      return e.name.endsWith('.js') ? [p] : [];
    });
  srcFiles = walk(path.join(ROOT, 'src')).length;
}

console.log('=== 实测数字（v6.7.77）===\n');
console.log(`check 函数（判别维度）: ${checkFns.size}`);
console.log(`  BLOCK_DIMS   : ${cnt('BLOCK_DIMS')}`);
console.log(`  REWRITE_DIMS : ${cnt('REWRITE_DIMS')}`);
console.log(`  VERIFY_DIMS  : ${cnt('VERIFY_DIMS')}`);
console.log(`MCP tools/list 工具数 : ${mcpTools}`);
console.log(`HANDLERS 键数         : ${handlers}`);
console.log(`ALLOWED_ROUTES 路由数 : ${routes}`);
console.log(`_modules 模块数       : ${modules}`);
console.log(`测试文件数            : ${tests}`);
console.log(`src JS 文件数         : ${srcFiles}`);
