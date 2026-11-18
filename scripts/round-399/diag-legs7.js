// r399 诊断 7：C 组样本「我能不能成，完全取决于您赏不赏识我。」为何不命中 ability_dependence ZH
// 这是 A 组（全族 analyze）失败样本；与 C 组样本不同。
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const text = '我能不能成，完全取决于您赏不赏识我。';
const r = mod.analyze(text);
console.log('signals:', JSON.stringify(r.signals), 'score:', r.score);
// 逐腿
mod.ZH_SIGNALS.ability_dependence.forEach((p, i) => {
  console.log(`za0${i}`, p.test(text) ? 'HIT' : 'miss');
});
