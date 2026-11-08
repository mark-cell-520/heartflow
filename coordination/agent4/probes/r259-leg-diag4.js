const gate = require('/data/home/heartflow/src/gate.js');
const t = 'The status quo has served us well, and the data confirms it still works.';
const g = gate.gate(t);
console.log('action:', g.gate.action);
console.log('dims:', (g.findings || []).map(f => f.dimension).join(','));
