// r629: 未接线实例详情表 —— 模块文件 + 方法名 + 辨别力探针输入，供 decision 本体选向
const { HeartFlow } = require('../src/core/heartflow.js');

(async () => {
  const hf = new HeartFlow();
  await hf.start();

  const targets = [
    'memoryKernel', 'memoryIndex', 'core', 'boundaryNeg', 'dreamConsolidation',
    'globalWorkspace', 'associativeEngine', 'aiSelfPositioning', 'decisionExecutor',
    'outputChecklist', 'agentCard', 'preferenceGuard', 'postTraining',
    'selfDiagnosis', 'decisionFeedback', 'instructions', 'daoDecision',
    'ruleGrowth', 'hypothesisDriver', 'fieldInjector', 'gapExecutor', 'whatLearned',
  ];

  const out = {};
  for (const t of targets) {
    const inst = hf[t];
    if (!inst) { out[t] = { missing: true }; continue; }
    let methods = [];
    try {
      methods = Object.getOwnPropertyNames(Object.getPrototypeOf(inst))
        .filter(m => m !== 'constructor' && typeof inst[m] === 'function');
    } catch (_) {}
    // 定位源文件
    let src = '';
    try {
      const ctor = inst.constructor;
      src = (ctor && ctor.__sourceFile) || (ctor && ctor.name) || '?';
    } catch (_) { src = '?'; }
    out[t] = { src, methods: methods.length, methodNames: methods };
  }

  console.log('RESULT' + JSON.stringify(out, null, 1));
  process.exit(0);
})().catch(e => { console.log('FATAL ' + e.message); process.exit(1); });
