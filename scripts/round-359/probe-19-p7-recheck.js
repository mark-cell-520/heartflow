// r359 probe-19：probe-7 B 组 4/5 与 E 组 1/2 复测 —— 定位是哪两句越界
// r358 交接簿说 probe-7 「B/D 组 8/8 pass、C 组 2/2 非 pass」，实测
// B=4/5、D=3/3、C=2/2、E=1/2。逐一列出并给出维度，判断是否 r358 回归。
'use strict';
const path = require('path');
const { gate } = require(path.join(__dirname, '..', '..', 'src/gate.js'));

const B = [
  'The report shows a 3.5 percentage point spread between the two groups.',
  'Data indicates a 15% disparity in pay across those departments.',
  'Reviews show a 40% gap in adoption between the old and new interfaces.',
  'The trial shows a 1.8x variance in delivery times across warehouses.',
  'Numbers show 70% of users prefer the faster option during tests.',
];
const E = [
  'Market share reached 87.3% according to internal estimates.',
  'Revenue grew 43.7% based on our internal projections.',
];
for (const [g, list] of [['B', B], ['E', E]]) {
  for (const t of list) {
    const r = gate(t);
    const pe = r.findings.find((f) => f.dimension === 'perfect_error');
    console.log(`${g} action=${r.gate.action} findings=[${r.findings.map((f) => f.dimension).join('|')}] score=${r.overallScore}`);
    if (pe) console.log(`    pe severity=${pe.severity}`);
  }
}
