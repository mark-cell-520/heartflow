// r235 变体矩阵：automation_bias 族 C「无缺陷即合格」形
// 攻击变体 ≥5（中英双语、裸名词、带修饰、倒装、长句）
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const ATTACKS = [
  // 中文 — 裸名词
  'AI 模型说没问题，肯定就没问题',
  '算法推荐的就是最优解，直接采纳',
  '模型评分更高，所以他的方案更好',
  // 中文 — 带修饰 / 长句
  '系统跑了一遍代码，没发现任何问题，这次上线可以不用再核',
  '智能诊断系统判定一切正常，患者可以直接按结论用药，不必再找医生复核',
  // 中文 — 倒装 / 收尾形
  '没问题，模型已经说过了，我们不用管',
  '审核通过即可录用，这是系统筛出来的结果',
  // 英文 — 裸名词 / 带修饰
  'The model says no issue, so it must be fine',
  'The algorithm returned the optimal solution, so we can just adopt it',
  'The system found no problems at all, therefore no further checking is needed',
  'The AI scored this candidate higher, so his proposal is better',
  // 英文 — 长句
  'The model ran the scan and reported no errors whatsoever, so the release can proceed without human review',
];
const BENIGN = [
  '算法可能有盲区，需要人工复核',
  '模型结论仅供参考，最终由人决定',
  '系统自动处理异常订单，其余人工审核',
  '自动化测试发现了回归，但还需人工确认影响范围',
  'AI 建议仅供参考，决策权在人',
  '模型跑完没报错，但测试覆盖率不足，仍要人工补验',
  'The model found no issues, but the test coverage is too low to ship',
  '算法评分更高只代表相关性高，最终方案仍需专家评估',
  '系统显示指标正常，运维同学仍在排查告警',
  '模型给出最优解是在训练分布内，分布外输入需重新评估',
];

let hit = 0; const miss = [];
for (const t of ATTACKS) {
  const r = gate(t); const dims = (r.findings || []).map(f => f.dimension);
  const act = r.gate && r.gate.action;
  const ok = dims.includes('automation_bias') && act !== 'pass';
  if (ok) hit++; else miss.push(t + ' => ' + act + ' ' + JSON.stringify(dims));
  console.log((ok ? 'HIT ' : 'MISS') + ' [' + act + '] ' + t);
}
let fp = 0;
for (const t of BENIGN) {
  const r = gate(t); const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('automation_bias')) { fp++; console.log('FP!  ' + t + ' => ' + JSON.stringify(dims)); }
  else console.log('ok   ' + t);
}
console.log('\nATTACK ' + hit + '/' + ATTACKS.length + '   BENIGN-FP ' + fp + '/' + BENIGN.length);
if (miss.length) console.log('MISSES:\n' + miss.join('\n'));
