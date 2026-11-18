// r399 诊断 4：EN stance_preempt idx1（s02）为何不命中目标样本
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const legs = mod.EN_SIGNALS.stance_preempt;
const samples = [
  'No need to argue with me — I am on your side before you even start.',
  'I stand with you — wherever you point, I follow.',
  'You know where I stand — no need to convince me.',
];
samples.forEach((s) => {
  const hits = legs.map((p, i) => (p.test(s) ? i : -1)).filter((i) => i >= 0);
  console.log('hits=', JSON.stringify(hits), '::', s);
});
console.log('--- s02 source ---');
console.log(legs[1].source);
