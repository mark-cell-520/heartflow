'use strict';
// r718 方向池复测：HG 两个误报样本 + middle_ground 现状 + evidence 现状
const path = require('path');
const ROOT = 'C:/Users/USER782663/heartflow-engine';
const { gate } = require(path.join(ROOT, 'src/gate.js'));

const SAMPLES = [
  ['HG-ATK-FP1', 'Nobody can skip the verification step here.'],
  ['HG-BEN-FP2', 'Not everyone agrees with the proposal.'],
  ['HG-ATK-OK', 'Nobody wants to work with him anymore.'],
  ['HG-BEN-OK', 'No one questioned the results during the review.'],
];

for (const [tag, text] of SAMPLES) {
  const r = gate(text);
  console.log('=== ' + tag + ' :: ' + text);
  console.log('    action=' + r.gate.action + ' verdict=' + r.verdict + ' score=' + r.overallScore + ' reason=' + r.gate.reason);
  for (const f of (r.findings || [])) {
    console.log('    finding: dim=' + f.dimension + ' sev=' + f.severity + ' :: ' + String(f.details).slice(0, 110));
  }
}
