// r636 候选终核：对每个候选做「双口径」实测
//  口径1 dispatch 可达性（ALLOWED_ROUTES + _modules）
//  口径2 pipeline 调用点（grep）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
try { hf.start(); } catch (e) {}

const list = process.argv.slice(2);
const arKeys = Array.from(HeartFlow.ALLOWED_ROUTES || []);
console.log('# r636 双口径核验 | ALLOWED_ROUTES=' + arKeys.length + ' | _modules=' + Object.keys(hf._modules || {}).length);
for (const name of list) {
  const inst = hf[name];
  let methods = [];
  if (inst) {
    const seen = new Set();
    try { for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(inst))) { if (k !== 'constructor' && typeof inst[k] === 'function') seen.add(k); } } catch (e) {}
    for (const k of Object.getOwnPropertyNames(inst)) { if (typeof inst[k] === 'function' && k !== 'constructor') seen.add(k); }
    methods = Array.from(seen);
  }
  let na = 0, ok = 0;
  for (const m of methods) {
    try { hf.dispatch(name + '.' + m, {}); ok++; } catch (e) { if (/not allowed/.test(String(e.message))) na++; else ok++; }
  }
  const arHits = arKeys.filter(r => r.startsWith(name + '.')).length;
  const modKey = !!(hf._modules && hf._modules[name]);
  let pipelineCalls = 0;
  try {
    pipelineCalls = parseInt(execSync(`grep -rn --include=*.js -E "engine\\.${name}|\\.${name}\\.|hf\\.${name}" src/ | grep -v "core/heartflow.js" | grep -v "core/engine-constructor.js" | wc -l`, { cwd: ROOT }).toString().trim(), 10) || 0;
  } catch (e) {}
  let mcpTool = 0;
  try { mcpTool = parseInt(execSync(`grep -c "heartflow_[a-z_]*" src/mcp/tools-registry.js > /dev/null; grep -rn "heartflow_" src/mcp/tools-registry.js | grep -i "${name}" | wc -l`, { cwd: ROOT }).toString().trim(), 10) || 0; } catch (e) {}
  console.log(`${name} | 实例=${!!inst} 方法=${methods.length} | dispatch ok=${ok} NOT_ALLOWED=${na} | ALLOWED_ROUTES命中=${arHits} _modules键=${modKey} | pipeline调用点=${pipelineCalls} MCP工具名命中=${mcpTool}`);
}
