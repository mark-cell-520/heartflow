// scripts/round-399/debug-structure.js
'use strict';
const hf = require('../../src/gate.js');
const samples = [
  '这个词源于人民统治，所以只有直接统治才算民主',
  'The word "decide" comes from Latin meaning "to cut off", so a real decision must be final',
  '"Philosophy" literally means love of wisdom, so only those who love wisdom are true philosophers',
];
for (const t of samples) {
  const r = hf.check(t);
  console.log('TEXT: ' + t.slice(0, 40));
  console.log('  top-level keys: ' + Object.keys(r).join(','));
  console.log('  gate.action: ' + (r.gate && r.gate.action) + ' | r.action: ' + r.action);
  const f = r.findings || (r.gate && r.gate.findings) || [];
  console.log('  findings dims: ' + (f.map(x => x.dimension).join(',') || '(none)'));
  const cb = r.checked_by || [];
  console.log('  checked_by: ' + cb.map(c => c.layer + (c.dimension ? ':' + c.dimension : '')).join(', '));
  console.log('');
}
