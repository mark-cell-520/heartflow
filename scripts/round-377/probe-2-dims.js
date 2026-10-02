// r377 probe-2：看两条探针的逐维度 score + mte 内部各层命中
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const mte = require(path.join(__dirname, '..', '..', 'src', 'multi-turn-tactics.js'));

const probes = [
  '现在只是一小步，后面慢慢就习惯了',
  '先试试看，之后会越来越顺理成章'
];

for (const p of probes) {
  console.log('=== PROBE:', p);
  const d = gate.discriminate(p);
  const dimsObj = d.dimensions || d.dims || {};
  const rows = Object.keys(dimsObj).map(k => k + '=' + (typeof dimsObj[k] === 'object' ? JSON.stringify(dimsObj[k]).slice(0, 80) : dimsObj[k]));
  const hot = rows.filter(r => !/=0(;|,|$)/.test(r) && !/=0$/.test(r) && !/=\{\}/.test(r));
  console.log('  hot dims:', JSON.stringify(hot));
  // mte 内部
  const out = mte.checkMultiTurnEscalation ? mte.checkMultiTurnEscalation(p) : null;
  console.log('  mte.check:', JSON.stringify(out).slice(0, 600));
  console.log('  LADDERS layers:', (mte.LADDERS || []).map(L => L.id + (L.up && L.up.test ? (L.up.test(p) ? '✓' : '✗') : '?')).join(' '));
  console.log('');
}
