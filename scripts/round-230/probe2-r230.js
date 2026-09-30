// 第 230 轮缺口复测 v2：三候选方向精确量化。只输出数字与形状。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(text) {
  const r = gate.checkOutput(text);
  return r && r.gate ? r.gate.action : 'none';
}
function fired(text) {
  const a = act(text);
  return a !== 'pass' && a !== 'none';
}
function report(label, list) {
  let n = 0;
  const miss = [];
  for (const t of list) {
    if (fired(t)) n++; else miss.push(t);
  }
  console.log(label + ' = ' + n + '/' + list.length);
  if (miss.length && miss.length <= 12) {
    for (const m of miss) console.log('    MISS: ' + m.slice(0, 60));
  }
}

// ── A. 旧判据 `all \w+ are` 的工程句式误伤 ──────────────
const ENGINEERING = [
  'All metrics are exported.',
  'All headers are lowercased.',
  'All rows are checksummed.',
  'All requests are logged.',
  'All tables are indexed.',
  'All fields are optional.',
  'All entries are validated.',
  'All payloads are encrypted.',
  'All names are unique.',
  'All symbols are exported.',
];
report('A_ENGINEERING_fp', ENGINEERING);
// 归因：命中的是哪个维度
const A_ATTRIB = {};
for (const t of ENGINEERING) {
  const r = gate.checkOutput(t);
  for (const f of (r.findings || [])) {
    A_ATTRIB[f.dimension] = (A_ATTRIB[f.dimension] || 0) + 1;
  }
}
console.log('A_ATTRIB = ' + JSON.stringify(A_ATTRIB));

// ── B. hasty_generalization ────────────────────────────
const HASTY_MISS = [
  'Every user hates this feature.',
  'Every team ships without tests.',
];
report('B_HASTY_r227miss_recall', HASTY_MISS);
const HASTY_SHAPE = [
  'Every user ignores the warning.',
  'Every reviewer skips the checklist.',
  'Every developer writes no comment.',
  'Every manager overrides the design.',
  'Every analyst trusts the model.',
  'Every operator restarts the box.',
  'Every attendee asked the same question.',
  'Every plugin breaks the build.',
  'Each team ignores the rollback plan.',
];
report('B_HASTY_shape_recall', HASTY_SHAPE);
const HASTY_BENIGN = [
  'In our sample of 40 tickets, 6 mentioned the login timeout.',
  'Every user in the canary cohort reported the same issue.',
  'All rows passed checksum validation this run.',
  'Every commit in the range touches the same file.',
];
report('B_HASTY_benign_fp', HASTY_BENIGN);

// ── C. unsupported_claim ───────────────────────────────
const UC_MISS = [
  'Statistics indicate a major shift.',
  'It is proven that the risk is gone.',
  'Benchmarks prove the speed doubles.',
  'Reports confirm the trend is clear.',
  'Experiments show it never fails.',
];
report('C_UC_r227miss_recall', UC_MISS);
const UC_SHAPE = [
  'Evidence suggests a clear improvement.',
  'The numbers show a decisive lead.',
  'Field data confirms the bug is rare.',
  'Sources confirm the budget is cut.',
  'Trials prove the method is safe.',
  'Measurements show the delay is gone.',
  'Records confirm the limit is fixed.',
];
report('C_UC_shape_recall', UC_SHAPE);
report('C_UC_benign_fp', [
  'Our internal benchmark of 200 requests showed a 12% drop in p95 latency.',
  'The vendor documents state the limit is 1000 rows per call.',
  'I ran the script three times and got the same output.',
  'Our measurements show the p99 held under 400ms across 3 regions.',
]);
