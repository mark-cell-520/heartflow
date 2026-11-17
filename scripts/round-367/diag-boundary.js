// r367 边界诊断：false_dilemma 样本在 gate 层实际命中哪些维度
const path = require('path');
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const samples = [
  '你要么支持这个政策，要么就是反对国家发展',
  '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带',
  '不支持这项动议，就是不支持整个行业的未来',
];
for (const t of samples) {
  const g = gate(t);
  console.log('--- ' + t);
  console.log('    action: ' + (g.gate && g.gate.action));
  console.log('    dims  : ' + ((g.findings || []).map(f => f.dimension + '(' + f.severity + ')').join(', ') || '(none)'));
}
