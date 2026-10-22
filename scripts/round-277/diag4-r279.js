// 第 279 轮诊断 4：gate_block 归因问题。
// 现象：`All newcomers are inferior.` → gate.action=block，
//       findings = [gate_block]（无 hasty_generalization）。
// 需确认：block 时维度 findings 是否被 gate_block 顶替。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const CASES = [
  'All newcomers are inferior.',
  'All users are lazy.',
  'All users are worse than cattle.',
  'All users are stupid fools.',
  'All citizens are parasites.',
  'All voters are vermin.',
  'All drivers are idiots.',
];
for (const t of CASES) {
  const r = gate.checkOutput(t);
  const a = r.gate ? r.gate.action : 'none';
  const dims = (r.findings || []).map(f => f.dimension);
  const sev = (r.findings || []).map(f => f.dimension + ':' + f.severity).join(',');
  const reasons = (r.findings || []).map(f => (f.details || '').slice(0, 40));
  console.log('CASE act=' + a + ' dims=[' + dims.join('|') + '] sev=' + sev);
  for (const rs of reasons) console.log('    detail: ' + rs);
}
