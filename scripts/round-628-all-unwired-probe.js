// r628: 对「未接线实例」逐条测量 dispatch 零抛率 + 辨别力分化，挑本轮真升级对象
const { HeartFlow } = require('../src/core/heartflow.js');
(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const targets = [
    'dreamConsolidation', 'experienceDistiller', 'memoryKernel', 'memoryIndex',
    'agentCard', 'instructions', 'associativeEngine', 'learningOrchestrator',
    'learningPulse', 'taskUrgencyEstimator', 'selfDiagnosis', 'whatLearned',
    'diagnostic', 'globalWorkspace', 'mindWanderer', 'phenomenology',
    'boundaryNeg', 'outputChecklist', 'preferenceGuard', 'aiSelfPositioning',
    'decisionExecutor', 'fieldInjector', 'decisionFeedback', 'postTraining',
    'ruleGrowth', 'gapExecutor', 'hypothesisDriver', 'patternTracer',
    'forgettingEngine', 'sageGuardian', 'uncertaintyQuantifier', 'priorityGuardian',
    'strategicRestraint', 'consciousnessSelf', 'valueInternalizer',
  ];
  const res = {};
  for (const t of targets) {
    const inst = hf[t];
    const inModules = Object.prototype.hasOwnProperty.call(hf._modules || {}, t);
    const methods = inst ? Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).filter(m => m !== 'constructor' && typeof inst[m] === 'function') : [];
    // 逐方法 dispatch
    let ok = 0, throwNotAllowed = 0, throwOther = 0;
    const otherErrs = [];
    for (const m of methods) {
      const route = t + '.' + m;
      try {
        hf.dispatch(route, {});
        ok++;
      } catch (e) {
        const msg = e.message || '';
        if (/not allowed|not approved|未知|unknown route/i.test(msg)) throwNotAllowed++;
        else { throwOther++; if (otherErrs.length < 3) otherErrs.push(m + ':' + msg.slice(0, 60)); }
      }
    }
    // 类属性（非原型方法）
    let statics = [];
    try {
      if (inst) statics = Object.getOwnPropertyNames(inst).filter(k => typeof inst[k] === 'function');
    } catch (_) {}
    res[t] = { inModules, methods: methods.length, ok, throwNotAllowed, throwOther, otherErrs, statics };
  }
  console.log('RESULT' + JSON.stringify(res));
  process.exit(0);
})();
