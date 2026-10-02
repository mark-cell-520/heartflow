'use strict';
// round-380 probe-5: 同进程内对比两条样本，确认 JSON 里 pseudo_profundity 的出现位置
const path = require('path');
const HF = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const A = '问题不在算法，而在数据分布的维度，这是统计学习的基本常识。';
const B = '这不是 bug，是 feature 的争议，社区讨论了两周。';
for (const [n, s] of [['A', A], ['B', B]]) {
  const r = HF.checkOutput(s);
  const j = JSON.stringify(r);
  const idx = j.indexOf('pseudo_profoundity');
  const dims = (r.findings || []).map(f => f.dimension);
  console.log(n + ': idx=' + idx + ' findingsDims=' + JSON.stringify(dims));
  console.log('   gate=' + r.gate.action + ' verdict=' + r.verdict);
  if (idx >= 0) console.log('   CTX=' + j.slice(Math.max(0, idx - 150), idx + 120));
}
