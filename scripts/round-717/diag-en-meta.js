'use strict';
const path = require('path');
const ROOT = 'C:/Users/USER782663/heartflow-engine';
const gate = require(path.join(ROOT, 'src/gate.js'));
const r = gate.checkOutput('Argument from silence is a fallacy in this case.');
console.log('action:', r.gate.action, '| reason:', r.gate.reason);
for (const f of (r.findings || [])) {
  console.log('finding:', f.dimension, f.severity, (f.details || '').slice(0, 60));
}
