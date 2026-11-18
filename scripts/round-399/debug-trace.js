// scripts/round-399/debug-trace.js
'use strict';
const hf = require('../../src/gate.js');
const samples = [
  '这个词源于人民统治，所以只有直接统治才算民主',
  'The word "decide" comes from Latin meaning "to cut off", so a real decision must be final',
  '"Philosophy" literally means love of wisdom, so only those who love wisdom are true philosophers',
  '「民主」这个词源于希腊语的「人民统治」，所以只有直接统治才算民主',
];
for (const t of samples) {
  const r = hf.check(t);
  console.log('TEXT: ' + t.slice(0, 44));
  console.log('  action: ' + r.action + ' | reason: ' + (r.reason || '').slice(0, 60));
  console.log('  traceSummary: ' + JSON.stringify(r.traceSummary).slice(0, 400));
  console.log('');
}
