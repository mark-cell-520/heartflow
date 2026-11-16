#!/usr/bin/bin node
'use strict';
/* r361 归因诊断 4：空 traceSummary 的 verify 样本深挖 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const hf = require(path.join(ROOT, 'src', 'gate.js'));
const samples = [
  '重新分层变动后，两组的生存率双双上升',
  '重新分组后，两个班的成绩水涨船高，但这只是统计假象',
  '重新分组之后，两组的指标水涨船高',
];
for (const s of samples) {
  const r = hf.check(s);
  console.log(JSON.stringify({ text: s.slice(0, 20), action: r.action, reason: r.reason, score: r.score, trace: r.traceSummary }));
  // 再跑 input 侧与 pipeline 侧看是否同源
  const p = hf.pipeline ? hf.pipeline(s) : null;
  if (p) console.log('  pipeline keys=' + JSON.stringify(Object.keys(p)));
}
