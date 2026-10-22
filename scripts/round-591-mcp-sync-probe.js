// r591 探针：MCP 三处同步缺口扫描
// 口径：tools-registry 有定义 && HANDLERS 无映射 = 外部 agent 拿到「未知工具」
// 只报数字与文件名，不贴样本原文
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const reg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');

// 1) registry 里声明的工具名
const declared = new Set();
const re = /name:\s*'(heartflow_[a-z0-9_]+)'/g;
let m;
while ((m = re.exec(reg))) declared.add(m[1]);

// 2) HANDLERS 块中的键名
const hIdx = srv.indexOf('HANDLERS');
const hBlock = hIdx >= 0 ? srv.slice(hIdx, hIdx + 60000) : '';
const handled = new Set();
const re2 = /(?:^|\s)(heartflow_[a-z0-9_]+)\s*:/g;
while ((m = re2.exec(hBlock))) handled.add(m[1]);

// 3) TOOLS 数组里的名字（工具定义）
const tIdx = srv.indexOf('const TOOLS');
const tBlock = tIdx >= 0 ? srv.slice(tIdx, srv.length) : '';
const toolsDefined = new Set();
while ((m = re.exec(tBlock))) toolsDefined.add(m[1]);

const missingHandler = [...declared].filter(n => !handled.has(n));
const missingTools = [...declared].filter(n => !toolsDefined.has(n));
const orphanHandler = [...handled].filter(n => !declared.has(n));

console.log(JSON.stringify({
  declaredInRegistry: declared.size,
  toolsDefinedInServer: toolsDefined.size,
  handledInHandlers: handled.size,
  missingHandler,
  missingTools,
  orphanHandler,
}, null, 2));
