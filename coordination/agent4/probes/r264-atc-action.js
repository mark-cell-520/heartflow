const hf = require('/data/home/heartflow/src/gate.js');
const s = '努力的人都会早起；他天天早起，足见他很努力。';
const g = hf.gate(s);
console.log(JSON.stringify({ action: g.gate.action, reason: g.gate.reason, findings: (g.findings || []).map(f => ({ d: f.dimension, sev: f.severity })) }, null, 1));
