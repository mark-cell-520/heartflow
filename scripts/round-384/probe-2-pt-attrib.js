// r384 探针 2：诊断 premature_termination 误抓的 T 信号归因
'use strict';
const pt = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/premature-termination.js');
const gate = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');
const { mteProbes } = require('/root/.hermes/skills/ai/mark-heartflow-skill/test/round-384-mte-samples.js');

for (const p of mteProbes) {
  const r = pt.checkPrematureTermination(p);
  console.log(JSON.stringify({
    sample: p.slice(0, 20),
    ptLevel: r.level,
    ptSignalIds: r.signals.map(s => s.id),
    ptDetails: r.details,
    gateAction: gate.checkOutput(p).gate.action,
  }));
}
