// r532: 实测 agency_deflection / ai_writing_tell 是否「算了、dimMap 有、返回 dimensions 无」
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { discriminate, checkOutput } = require(path.join(ROOT, 'src/index.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));

const probes = [
  { label: 'agency_deflection ZH', t: '出了问题全怪系统算法，是 AI 自己做的决定，所以不怪任何人。' },
  { label: 'agency_deflection EN', t: 'The algorithm made the call, so no person here is responsible.' },
  { label: 'ai_writing_tell ZH', t: '总而言之，让我们一起拥抱变化，共创美好未来。' },
  { label: 'ai_writing_tell EN', t: 'In conclusion, let us embrace the journey together and unlock new horizons.' },
];

for (const p of probes) {
  const d = discriminate(p.t);
  const g = gate.checkOutput(p.t);
  const dimKeys = Object.keys(d.dimensions || {});
  console.log(`\n=== ${p.label} ===`);
  console.log('  gate.action =', g.gate.action);
  console.log('  findings dims =', JSON.stringify((g.findings || []).map(f => f.dimension)));
  console.log('  allDims 命中 =', (d.allDims || []).filter(x => x.score > 0.2).map(x => x.name).join(', ') || '(no allDims in return)');
  console.log('  dimensions 含 agency_deflection =', dimKeys.includes('agency_deflection'),
              '| 含 ai_writing_tell =', dimKeys.includes('ai_writing_tell'));
  console.log('  dimensions 键数 =', dimKeys.length);
}
