const fs = require('fs');
const path = require('path');
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name === 'node_modules') continue; walk(p, out); }
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const files = walk('src', []).concat(walk('test', []));
const targets = {
  ruleGrowth: ['observe', 'evaluate', 'toDecisionRouterRules', 'getStats'],
  preferenceGuard: ['shouldApply', 'evaluateAll', 'detectConflict', 'getStats'],
  outputChecklist: ['runChecklist', 'quickCheck', 'getStats'],
  associativeEngine: ['process', 'getFullTrace', 'getStats', 'resetStats'],
  fieldInjector: ['inject', 'extractSignals', 'computeConfidence', 'batchInject'],
  dreamConsolidation: ['dream', 'dreamNow', 'dreamCycle', 'getLastDream', 'getDecayParams'],
  decisionFeedback: ['recordOutcome', 'getAdjustedWeight', 'adjustPriorities'],
  memoryIndex: ['recordBoot', 'getBootSummary', 'updateUser'],
  agentCard: ['loadOrCreate', 'getCard', 'verify'],
  globalWorkspace: ['registerAgent', 'cognitiveCycle', 'integrate', 'getBlackboard'],
  instructions: ['getAll', 'check', 'getStats'],
  selfDiagnosis: ['run'],
  postTraining: ['schedule', 'getStats', 'clear'],
  gapExecutor: ['execute', 'getStats'],
  memoryKernel: ['validate', 'audit', 'getInitErrors'],
  boundaryNeg: ['isUsageExceeded', 'hasPermission', 'pruneExpiredPermissions'],
  whatLearned: ['report', 'brief'],
};
for (const [mod, meths] of Object.entries(targets)) {
  const lines = [];
  for (const m of meths) {
    const hits = files.filter(f => {
      const c = fs.readFileSync(f, 'utf8');
      return c.includes('.' + m + '(') || c.includes('.' + m + ' ');
    });
    const coreHits = hits.filter(f => !f.includes('test/'));
    // 只看是否存在调用（排除定义文件本身粗略）
    lines.push(m + ':' + coreHits.length);
  }
  console.log(mod, lines.join(' '));
}
