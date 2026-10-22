// r635 候选详查：对高优先级候选列真实方法名 + MCP 包装存在性 + pipeline 消费点
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const targets = ['hypothesisDriver', 'outputChecklist', 'memoryIndex', 'globalWorkspace',
  'decisionFeedback', 'ruleGrowth', 'aiSelfPositioning', 'dreamConsolidation',
  'associativeEngine', 'postTraining', 'agentCard', 'decisionExecutor', '_engram', 'gapExecutor', 'fieldInjector'];

const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
try { hf.start(); } catch (e) {}

const mcpSrc = fs.readFileSync(path.join(ROOT, 'src', 'mcp-server.js'), 'utf8');
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (f.endsWith('.js')) files.push(p);
  }
})(path.join(ROOT, 'src'));

for (const t of targets) {
  const inst = hf[t];
  let methods = [];
  let isStub = false;
  if (inst) {
    const seen = new Set();
    try { for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(inst))) { if (k !== 'constructor' && typeof inst[k] === 'function') seen.add(k); } } catch (e) {}
    for (const k of Object.getOwnPropertyNames(inst)) { if (typeof inst[k] === 'function' && k !== 'constructor') seen.add(k); }
    methods = Array.from(seen).filter(m => !m.startsWith('_'));
    if (methods.length === 2 && methods.includes('healthCheck') && methods.includes('getStats')) isStub = true;
  }
  // MCP 包装
  let mcp = [];
  for (const m of ['heartflow_' + t.replace(/^_/, '')]) { if (mcpSrc.includes(m)) mcp.push(m); }
  // pipeline 消费点（除 heartflow.js 外引用该实例名的文件数）
  const consumers = [];
  for (const f of files) {
    if (f.endsWith('heartflow.js')) continue;
    const src = fs.readFileSync(f, 'utf8');
    if (new RegExp('\\b' + t + '\\b').test(src)) consumers.push(path.relative(ROOT, f));
  }
  console.log(`=== ${t} === stub=${isStub} 方法${methods.length}: ${methods.join(',')}`);
  console.log(`    MCP包装: ${mcp.length ? mcp.join(',') : '无'} | dispatch可达: false`);
  console.log(`    消费方: ${consumers.slice(0, 6).join(', ')}${consumers.length > 6 ? ' (+' + (consumers.length - 6) + ')' : ''}`);
}
