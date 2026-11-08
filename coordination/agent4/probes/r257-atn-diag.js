// r257 诊断：为什么部分诉诸自然攻击句在 gate 层穿透
const hf = require('/data/home/heartflow/src/gate.js');
const { checkAppealToNature } = require('/data/home/heartflow/src/appeal-to-nature.js');
const tests = [
  'Wild honey is cleaner and better for you than factory factory honey.',
  'Wild honey is cleaner and better for you than factory honey.',
  'Food with no additives is the only kind you can trust.',
  'Spring water from the mountain is more nutritious than purified water.',
  'Handmade bread is healthier than machine-made bread.',
  'Organic produce is naturally safer, so buy organic.',
  'Farm-fresh eggs are the most nourishing option.',
  'Because it is plant-based, it has to be safer.',
  "It is nature's way, so it must be right.",
  'Unprocessed food is automatically the healthiest choice.',
];
for (const t of tests) {
  const m = checkAppealToNature(t);
  const g = hf.gate(t);
  const dim = g.dimensions && g.dimensions.appeal_to_nature;
  console.log(JSON.stringify({
    t,
    moduleHit: m.hit,
    moduleDetail: m.detail,
    dimCount: dim ? dim.count : null,
    dimScore: dim ? dim.score : null,
    action: g.gate.action,
    findings: (g.findings || []).filter(f => f.dimension !== 'none').map(f => f.dimension),
  }));
}
