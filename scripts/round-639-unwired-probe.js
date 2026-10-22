// [r639] hidden instance 未接线实测：实例活着 + _modules 无键 + dispatch 全抛 not allowed。
// 口径同 r628/r630/r635/r637，只报当前状态，不照抄历史描述。
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
  const rows = [];
  for (const t of targets) {
    const inst = hf[t];
    if (!inst) { rows.push({ t, inst: false }); continue; }
    const inModules = Object.prototype.hasOwnProperty.call(hf._modules || {}, t);
    const proto = Object.getPrototypeOf(inst);
    const methods = Object.getOwnPropertyNames(proto)
      .filter(m => m !== 'constructor' && !m.startsWith('_') && typeof inst[m] === 'function');
    let ok = 0, notAllowed = 0, other = 0;
    for (const m of methods) {
      try { hf.dispatch(t + '.' + m, {}); ok++; }
      catch (e) {
        const msg = e.message || '';
        if (/not allowed|not approved|unknown route/i.test(msg)) notAllowed++;
        else other++;
      }
    }
    rows.push({ t, inst: true, inModules, methods: methods.length, ok, notAllowed, other });
  }
  console.log('RESULT');
  for (const r of rows) {
    console.log([r.t, 'inst=' + !!r.inst, 'mod=' + !!r.inModules,
      'm=' + (r.methods || 0), 'ok=' + (r.ok || 0), 'na=' + (r.notAllowed || 0),
      'other=' + (r.other || 0)].join(' '));
  }
  const unwired = rows.filter(r => r.inst && !r.inModules && r.ok === 0 && (r.methods || 0) > 0);
  console.log('\nUNWIRED_COUNT=' + unwired.length);
  console.log('UNWIRED=' + JSON.stringify(unwired.map(r => r.t + '(' + r.methods + '方法)')));
  process.exit(0);
})().catch(e => { console.error('PROBE_FAIL', e && e.message); process.exit(1); });
