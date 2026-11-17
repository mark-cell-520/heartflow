// r367 端到端 gate 实测：确认 package_deal 在 gate 层真实可达
const path = require('path');
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const samples = [
  '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带',
  '支持环保的人必然也支持大政府，这是一整套左翼立场，不能拆开支持',
  '买这个品牌就得接受它的全部价值观，不能只买产品不认理念',
  'You have to accept the whole package or reject it entirely; you cannot agree with just one part',
  'Their platform is a package deal: you must endorse every plank or none of it',
  '这套方案的几条措施各自独立，可以逐条评估，有的可以支持有的可以反对',
];
for (const t of samples) {
  const g = gate(t);
  console.log('--- ' + t.slice(0, 50));
  console.log('    action=' + (g.gate && g.gate.action) + ' score=' + g.overallScore);
  console.log('    dims  : ' + ((g.findings || []).map(f => f.dimension).join(', ') || '(none)'));
}
