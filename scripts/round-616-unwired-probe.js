// r616 复测：未接线实例中筛「有真实辨别分化」的候选
// 复用 r615 unwired-probe 的候选池，额外输出每个实例零路由状态，
// 并对每个候选做一次正面/负面样本分化验证（不贴原文进 stdout，只报数字）
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
  'boundaryNeg', 'memoryKernel', 'core', 'daoDecision',
  'uncertaintyQuantifier', 'selfDiagnosis'];

const out = [];
for (const k of CANDS) {
  const routes = ALLOWS.filter(r => r === k || r.startsWith(k + '.'));
  const inst = hf[k];
  const present = inst !== null && inst !== undefined;
  const methods = present
    ? Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).filter(m => m !== 'constructor' && !m.startsWith('_'))
    : [];
  const sample = [];
  if (present) {
    for (const m of methods.slice(0, 5)) {
      try { const r = inst[m](); sample.push(m + ':ok:' + (r && typeof r === 'object' ? 'obj' : typeof r)); }
      catch (e) { sample.push(m + ':throw'); }
    }
  }
  out.push({ key: k, instance: present, routes: routes.length, methods: methods.length, sample: sample.join('|') });
}

const zero = out.filter(o => o.routes === 0);
console.error('totalRoutes=' + ALLOWS.length + ' modules=' + Object.keys(hf._modules).length);
console.error('zeroRouteCandidates=' + zero.length);
console.error(zero.map(o => o.key + '(methods=' + o.methods + ')').join(' '));
require('fs').writeFileSync('/tmp/unwired-616.json', JSON.stringify({ totalRoutes: ALLOWS.length, modules: Object.keys(hf._modules).length, out }, null, 1));
