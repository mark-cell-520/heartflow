// scripts/round-622-route-status.js
'use strict';
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
hf.start();
const ALLOWS = HeartFlow.ALLOWED_ROUTES ? Array.from(HeartFlow.ALLOWED_ROUTES) : [];
const CANDS = ['outputChecklist', 'whatLearned', 'instructions', 'fieldInjector',
  'strategicRestraint', 'dreamConsolidation', 'globalWorkspace', 'associativeEngine',
  'memoryIndex', 'aiSelfPositioning', 'hypothesisDriver', 'decisionFeedback',
  'ruleGrowth', 'gapExecutor', 'decisionExecutor', 'experienceDistiller',
  'learningPulse', 'learningOrchestrator', 'taskUrgencyEstimator', 'mindWanderer',
  'phenomenology', 'agentCard', 'patternTracer', 'preferenceGuard', 'postTraining',
  'boundaryNeg', 'memoryKernel', 'core', 'daoDecision', 'selfDiagnosis',
  'dataEraser', 'continuousLearner', 'verifierGrant', 'mindSpace', 'transmission',
  'cognitiveEngine', 'decisionEngineV2', 'memoryConsolidation', 'emotionDynamics', 'dreamEngineV2'];
const out = [];
for (const k of CANDS) {
  const routes = ALLOWS.filter(r => r === k || r.startsWith(k + '.'));
  const inst = hf[k];
  const present = inst !== null && inst !== undefined;
  let methods = 0;
  if (present) {
    const proto = Object.getPrototypeOf(inst);
    methods = proto ? Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof inst[m] === 'function').length : 0;
  }
  out.push({ k, present, routes: routes.length, methods });
}
console.log('TOTAL_ROUTES=' + ALLOWS.length);
for (const o of out) console.log('ST|' + o.k + '|instance=' + (+o.present) + '|routes=' + o.routes + '|methods=' + o.methods);
require('fs').writeFileSync('/tmp/r622-route-status.json', JSON.stringify(out, null, 1));
