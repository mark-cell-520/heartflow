const fs = require('fs');
const path = require('path');
const targets = ['hypothesisDriver','outputChecklist','decisionFeedback','ruleGrowth','aiSelfPositioning','associativeEngine','fieldInjector','dreamConsolidation','memoryKernel','memoryIndex','globalWorkspace','instructions','agentCard','preferenceGuard','boundaryNeg','selfDiagnosis','diagnostic','postTraining','decisionExecutor','gapExecutor','whatLearned'];
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const files = walk('src', []);
for (const t of targets) {
  const hits = files.filter(f => {
    const c = fs.readFileSync(f, 'utf8');
    return new RegExp('\\b' + t + '\\b').test(c);
  });
  const inLifecycle = hits.filter(f => f.includes('engine-lifecycle') || f.includes('heartflow.js'));
  console.log(t, 'srcRefs=' + hits.length, 'coreRefs=' + inLifecycle.length);
}
