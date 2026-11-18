'use strict';
const hf = require('../../src/gate.js');
const r = hf.gate('竞标赢了说明这块地就值这个价，我们的判断得到了验证。');
console.log(JSON.stringify({
  action: r.action, reason: r.reason,
  findings: (r.findings || []).map(f => ({ d: f.dimension, s: f.severity, det: (f.details || '').slice(0, 90) })),
}, null, 1));
