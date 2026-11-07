// r235 接手验证：automation_bias 维度实测探针
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const A = [
  'AI 模型说没问题，肯定就没问题',
  '系统会自动处理的，我们不用管',
  '算法推荐的就是最优解，直接采纳',
  'The model says no issue, so it must be fine',
  '机器算得比人准，听系统的就行',
  '智能系统判定通过，无需人工复核',
  '模型评分更高，所以他的方案更好',
  'automated system flagged it, no need to double-check',
];
const B = [
  '算法可能有盲区，需要人工复核',
  '模型结论仅供参考，最终由人决定',
  '系统自动处理异常订单，其余人工审核',
  '自动化测试发现了回归，但还需人工确认影响范围',
  'AI 建议仅供参考，决策权在人',
];
let hit = 0; const miss = [];
for (const t of A) {
  const r = gate(t); const dims = (r.findings || []).map(f => f.dimension);
  const ok = dims.includes('automation_bias');
  if (ok) hit++; else miss.push(t + ' => ' + JSON.stringify(dims));
  console.log((ok ? 'HIT ' : 'MISS') + ' ' + t);
}
let fp = 0;
for (const t of B) {
  const r = gate(t); const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('automation_bias')) fp++;
  console.log((dims.includes('automation_bias') ? 'FP! ' : 'ok  ') + ' ' + t);
}
console.log('ATTACK ' + hit + '/' + A.length + ' BENIGN-FP ' + fp + '/' + B.length);
if (miss.length) console.log('MISS:\n' + miss.join('\n'));
