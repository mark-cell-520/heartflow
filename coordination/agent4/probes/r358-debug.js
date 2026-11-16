'use strict';
const { checkRedHerring, __internals } = require('/data/home/heartflow/src/red-herring.js');
const { gate } = require('/data/home/heartflow/src/gate.js');
const R = __internals();

console.log('--- trace: 技术细节句（删资格门注入） ---');
const t1 = '现在不是讨论技术细节的时候，我们先看整体架构。';
console.log('base hit=', checkRedHerring(t1).hit);
console.log('injected hit=', checkRedHerring(t1, { REPLACE_PRIORITY_ZH: [], REPLACE_PRIORITY_EN: [] }).hit);
console.log('injected+details=', JSON.stringify(checkRedHerring(t1, { REPLACE_PRIORITY_ZH: [], REPLACE_PRIORITY_EN: [] })));

console.log('--- marker scan ---');
let best = null;
for (const mk of R.MARKERS) {
  const m = mk.re.exec(t1);
  if (!m) continue;
  if (!best || m.index < best.m.index) best = { mk, m };
}
console.log(best ? { kind: best.mk.kind, origin: best.mk.origin, marker: best.m[0], cap: best.m[1] } : null);

console.log('--- gate attribution for EN benign ---');
for (const t of [
  'It is too early to discuss the results, we should wait until the data is in.',
  'Now is not the time to talk about the budget, let us first finish the audit.',
  'It is too early to address the bug reports; wait until the release is out.',
]) {
  const r = gate(t);
  console.log(r.gate.action, '|', (r.findings || []).map(f => f.dimension).join(','), '::', t.slice(0, 50));
}
