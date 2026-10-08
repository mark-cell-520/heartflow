// r632: 为 decision 本体准备候选池——实测未接线高价值实例的方法面 + MCP 覆盖情况。
// 只读探针，不碰引擎。
const fs = require('fs');
const { HeartFlow } = require('../src/core/heartflow.js');

const mcpSrc = fs.readFileSync(require('path').join(__dirname, '..', 'src', 'mcp-server.js'), 'utf8');

const targets = [
  'hypothesisDriver', 'outputChecklist', 'decisionExecutor', 'globalWorkspace',
  'memoryKernel', 'agentCard', 'associativeEngine', 'selfDiagnosis',
  'dreamConsolidation', 'boundaryNeg', 'aiSelfPositioning', 'fieldInjector',
  'decisionFeedback', 'postTraining', 'ruleGrowth', 'gapExecutor',
];

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const lines = [];
  for (const t of targets) {
    const inst = hf[t];
    if (!inst) { lines.push(t + ' NO_INSTANCE'); continue; }
    const proto = Object.getPrototypeOf(inst);
    const methods = Object.getOwnPropertyNames(proto)
      .filter(m => m !== 'constructor' && typeof inst[m] === 'function');
    // MCP 是否已有同名 heartflow_<t> 工具定义
    const mcpHit = mcpSrc.includes('heartflow_' + t.toLowerCase()) || mcpSrc.includes('heartflow_' + t);
    // pipeline 是否已有旁路调用（在 src/ 内被 this.<t>. 引用）
    const lines0 = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = dir + '/' + e.name;
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.js')) lines0.push(p);
      }
    };
    walk(require('path').join(__dirname, '..', 'src'));
    let pipeRefs = 0;
    for (const f of lines0) {
      const s = fs.readFileSync(f, 'utf8');
      const re = new RegExp('\\.' + t + '\\.', 'g');
      const n = (s.match(re) || []).length;
      if (n) pipeRefs += n;
    }
    lines.push([t, 'm=' + methods.length, 'mcp=' + (mcpHit ? 'yes' : 'no'), 'pipeRefs=' + pipeRefs, '[' + methods.join(',') + ']'].join(' '));
  }
  console.log('CANDIDATES_R632');
  console.log(lines.join('\n'));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
