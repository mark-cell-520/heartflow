// r640: 快速 dump 未接线候选的公有方法名，用于构造有区分度的 decision 判据。
const mods = ['dreamConsolidation','memoryIndex','agentCard','associativeEngine',
  'selfDiagnosis','whatLearned','diagnostic','globalWorkspace','outputChecklist',
  'aiSelfPositioning','decisionExecutor','fieldInjector','postTraining',
  'gapExecutor','hypothesisDriver'];
const out = {};
for (const m of mods) {
  try {
    const C = require('../src/loader/lazy-registry.js');
    void C;
  } catch (e) {}
}
// 直接从 heartflow 实例拿
const { HeartFlow } = require('../src/core/heartflow.js');
(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const lines = [];
  for (const m of mods) {
    const inst = hf[m];
    if (!inst) { lines.push(m + ' : NO_INSTANCE'); continue; }
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(inst))
      .filter(x => x !== 'constructor' && typeof inst[x] === 'function');
    lines.push(m + ' : ' + methods.join(', '));
  }
  console.log(lines.join('\n'));
  process.exit(0);
})();
