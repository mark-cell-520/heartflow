// r615 未接线候选复测：按 r604 探针清单，逐个核实「零 dispatch 路由」与「辨别力」
const path = require('path');
const HF = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(HF, 'src', 'core', 'heartflow.js'));

const hf = new HeartFlow();
hf.start();
const ALLOWS = HeartFlow.ALLOWED_ROUTES ? Array.from(HeartFlow.ALLOWED_ROUTES) : [];

const CANDS = ['outputChecklist', 'whatLearned', 'instructions', 'fieldInjector',
  'strategicRestraint', 'dreamConsolidation', 'globalWorkspace', 'associativeEngine',
  'memoryIndex', 'aiSelfPositioning', 'hypothesisDriver', 'decisionFeedback',
  'ruleGrowth', 'gapExecutor', 'decisionExecutor', 'experienceDistiller',
  'learningPulse', 'learningOrchestrator', 'taskUrgencyEstimator', 'mindWanderer',
  'phenomenology', 'agentCard', 'patternTracer', 'preferenceGuard', 'postTraining',
  'boundaryNeg', 'memoryKernel', 'core', 'priorityGuardian', 'daoDecision',
  'uncertaintyQuantifier', 'selfDiagnosis'];

const out = {};
for (const k of CANDS) {
  const routes = ALLOWS.filter(r => r === k || r.startsWith(k + '.'));
  const inst = hf[k];
  const present = inst !== null && inst !== undefined;
  const methods = present
    ? Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).filter(m => m !== 'constructor' && !m.startsWith('_'))
    : [];
  out[k] = {
    instance: present,
    routes: routes.length,
    routeList: routes,
    methods: methods.length,
    zeroThrowSample: [],
  };
  // 对零抛方法做一次空实参 dispatch / 直调采样
  if (present) {
    for (const m of methods.slice(0, 6)) {
      try {
        const r = inst[m]();
        out[k].zeroThrowSample.push(m + ':ok:' + (r && typeof r === 'object' ? 'obj' : typeof r));
      } catch (e) {
        out[k].zeroThrowSample.push(m + ':throw:' + String(e.message).slice(0, 60));
      }
    }
  }
}
console.log(JSON.stringify({ totalRoutes: ALLOWS.length, modules: Object.keys(hf._modules).length, cands: out }, null, 1));
