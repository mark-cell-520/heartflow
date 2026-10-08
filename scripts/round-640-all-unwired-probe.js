// r630: 分两阶段实测「未接线实例」当前真实状态，避免脑内假设。
// 阶段1：全量扫（r628 同一口径）——inModules / methods / dispatch 零抛
// 阶段2：只对「零抛且 _modules 无键」的高分候选，逐方法空实参 dispatch
//         记录 throwOther 明细，判定接线后是否首次可达。
const { HeartFlow } = require('../src/core/heartflow.js');
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
].map(s => s.charAt(0).toLowerCase() + s.slice(1));

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const phase1 = [];
  for (const t of targets) {
    const inst = hf[t];
    if (!inst) { phase1.push({ t, inModules: false, inst: false, methods: 0, ok: 0, notAllowed: 0, other: 0 }); continue; }
    const inModules = Object.prototype.hasOwnProperty.call(hf._modules || {}, t);
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).filter(m => m !== 'constructor' && typeof inst[m] === 'function');
    let ok = 0, notAllowed = 0, other = 0;
    const errs = [];
    for (const m of methods) {
      try { hf.dispatch(t + '.' + m, {}); ok++; }
      catch (e) {
        const msg = e.message || '';
        if (/not allowed|not approved|unknown route/i.test(msg)) notAllowed++;
        else { other++; if (errs.length < 2) errs.push(m + ':' + msg.slice(0, 50)); }
      }
    }
    phase1.push({ t, inModules, inst: true, methods: methods.length, ok, notAllowed, other, errs });
  }
  const lines = [];
  lines.push('RESULT_P1');
  for (const p of phase1) {
    lines.push([p.t, 'inst=' + p.inst, 'mod=' + p.inModules, 'm=' + p.methods, 'ok=' + p.ok, 'na=' + p.notAllowed, 'other=' + p.other, (p.errs || []).join('|')].join(' '));
  }
  const unwiredZeroThrow = phase1.filter(p => p.inst && !p.inModules && p.other === 0 && p.methods > 0);
  lines.push('UNWIRED_ZEROTHROW=' + JSON.stringify(unwiredZeroThrow.map(p => p.t + '(' + p.methods + ')')));
  console.log(lines.join('\n'));
  process.exit(0);
})();
