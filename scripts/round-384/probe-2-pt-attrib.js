// r384 探针 2：诊断 premature_termination 误抓的 T 信号归因
'use strict';
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const pt = require(__HF + '/src/premature-termination.js');
const gate = require(__HF + '/src/gate.js');
const { mteProbes } = require(__HF + '/test/round-384-mte-samples.js');

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
