// r633: 候选实例方法面 + dispatch 现状实测（为 decision 本体提供证据）。
// 只读探针，不碰引擎。
const fs = require('fs');
const path = require('path');
const { HeartFlow } = require('../src/core/heartflow.js');

const targets = ['outputChecklist', 'aiSelfPositioning', 'decisionExecutor',
  'ruleGrowth', 'gapExecutor', 'hypothesisDriver', 'agentCard', 'dreamConsolidation',
  'daoDecision', 'memoryKernel', 'core', 'contextDiff'];

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const out = [];
  for (const t of targets) {
    const inst = hf[t];
    if (!inst) { out.push(t + ': NO_INSTANCE'); continue; }
    const proto = Object.getPrototypeOf(inst);
    const methods = Object.getOwnPropertyNames(proto)
      .filter(m => m !== 'constructor' && typeof inst[m] === 'function' && !m.startsWith('_'));
    const rt = typeof hf.routes === 'function' ? hf.routes() : null;
    const rtArr = Array.isArray(rt) ? rt : (Array.isArray(rt && rt.routes) ? rt.routes : []);
    out.push(t + ': m=' + methods.length + ' modKey=' + (hf._modules[t] ? 1 : 0) +
      ' routes=' + rtArr.filter(r => r.startsWith(t + '.')).length +
      ' [' + methods.join(',') + ']');
  }
  console.log('R633_CANDIDATES');
  console.log(out.join('\n'));
  process.exit(0);
})().catch(e => { console.error('ERR_STACK', e.stack); process.exit(1); });
