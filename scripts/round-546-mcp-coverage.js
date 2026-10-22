// r546 探针：MCP 工具声明 vs handler 映射覆盖度
// 找出「tools-registry 声明了但 mcp-server 没有 handler」的工具（真升级④ 候选）
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const { TOOLS } = require(path.join(ROOT, 'src/mcp/tools-registry.js'));
const serverSrc = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');

const toolNames = TOOLS.map(t => t.name);
const missing = [];
const present = [];
for (const name of toolNames) {
  // handler 映射：server 里出现该工具名字符串
  const hit = serverSrc.includes(`'${name}'`) || serverSrc.includes(`"${name}"`);
  (hit ? present : missing).push(name);
}
console.log('tools declared: ' + toolNames.length);
console.log('has handler ref in mcp-server: ' + present.length);
console.log('--- declared but NO handler ref ---');
console.log(missing.join('\n') || '(none)');

// dispatch 路由 vs ALLOWED_ROUTES 覆盖
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
const staticRoutes = [...HeartFlow.ALLOWED_ROUTES];
console.log('--- ALLOWED_ROUTES static size: ' + staticRoutes.length);
