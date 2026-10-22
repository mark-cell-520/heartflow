// r596：清点 HANDLERS vs TOOLS(registry) 的不一致——MCP 层空壳/未注册工具盘点
const fs = require('fs');
const path = require('path');
const { TOOLS } = require('../src/mcp/tools-registry.js');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'mcp-server.js'), 'utf8');
const re = /^  (heartflow_[a-z0-9_]+):\s*(?:async\s+)?(?:\([a-zA-Z_$][\w$]*(?:\s*,\s*[a-zA-Z_$][\w$]*)*\)\s*=>|[A-Za-z_$][\w$]*\s*,)/gm;
let m;
const handlers = [];
while ((m = re.exec(src))) handlers.push(m[1]);

const reg = new Set(TOOLS.map(t => t.name));
const hd = new Set(handlers);
const inHandlerNotReg = handlers.filter(n => !reg.has(n));
const inRegNotHandler = [...reg].filter(n => !hd.has(n));

console.log('TOOLS(registry) =', TOOLS.length, '| HANDLERS =', handlers.length);
console.log('--- handler 有但 registry 无定义（MCP 客户端 tools/list 看不到，调不到）---');
console.log(inHandlerNotReg.join(', ') || '无');
console.log('--- registry 有但无 handler（调用会 Method not found）---');
console.log(inRegNotHandler.join(', ') || '无');
