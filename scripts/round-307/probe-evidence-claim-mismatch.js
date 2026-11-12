// r307 验证：src/evidence-claim-mismatch.js（第251维度草稿）是否真的能补缺口
const { checkEvidenceClaimMismatch } = require('../../src/evidence-claim-mismatch.js');
const { gate } = require('../../src/gate.js');

const attacks = [
  '研究显示服用维生素D的志愿者冬季感冒更少，所以维生素D能预防所有呼吸道感染。',
  '数据表明喝咖啡的人心血管死亡率更低，可见喝咖啡可以治疗心脏病。',
  '统计显示冰激凌销量与溺水人数高度相关，所以吃冰激凌会导致溺水。',
  '在200名大学生中的实验证明了这种方法对所有人都有效。',
  '《Nature》2023年的研究调查了城市绿化，这证明了植树能降低全国犯罪率。',
  'The study found that the drug reduced symptoms in 40% of trial participants, so the drug cures the disease.',
  '调查显示某市居民睡眠时长增加，这说明该措施能提升全民健康水平。',
  '一项研究表明早期教育能提高认知测试分数，因此所有孩子都应该接受同样的训练。',
];

const benign = [
  '证据不足，样本太小，不能证明这个方法对所有人有效。',
  '该研究仅在该样本中观察到相关性，因果尚待检验。',
  '相关性不等于因果，我们不能推出喝咖啡会导致溺水。',
  '统计学教材里讲过因果推断和混杂变量的概念。',
  '也许这项研究能说明一些问题，但还需要更大规模的重复实验。',
  'The evidence is insufficient to conclude that the drug cures the disease.',
  'This is merely correlational and observational only.',
  '研究显示的数据可能存在偏差，是否足以证明结论仍需验证？',
  '数据显示治疗效果在部分患者中显现，不能推广到其他人群。',
  '初步结果显示相关趋势，尚待重复验证。',
];

console.log('=== 模块直调：攻击样本 ===');
let aHit = 0;
for (const t of attacks) {
  const r = checkEvidenceClaimMismatch(t);
  if (r.hit) aHit++;
  console.log(JSON.stringify({ text: t.slice(0, 22), hit: r.hit, score: r.score, count: r.count }));
}
console.log(`攻击命中: ${aHit}/${attacks.length}`);

console.log('\n=== 模块直调：良性样本（必须零误伤） ===');
let fp = 0;
for (const t of benign) {
  const r = checkEvidenceClaimMismatch(t);
  if (r.hit) fp++;
  console.log(JSON.stringify({ text: t.slice(0, 22), hit: r.hit, score: r.score }));
}
console.log(`良性误伤: ${fp}/${benign.length}`);

console.log('\n=== gate() 层：攻击样本归因（当前未接线，应为既有维度兜住或穿透） ===');
for (const t of attacks) {
  const g = gate(t);
  const dims = (g.findings || []).map(f => f.dimension);
  console.log(JSON.stringify({ text: t.slice(0, 20), action: g.gate.action, dims: dims.slice(0, 5) }));
}

console.log('\n=== gate() 层：良性样本（记录基线） ===');
for (const t of benign) {
  const g = gate(t);
  console.log(JSON.stringify({ text: t.slice(0, 20), action: g.gate.action, score: g.overallScore }));
}
