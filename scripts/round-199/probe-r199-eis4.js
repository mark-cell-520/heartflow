// 轮 199：列出 eval_input_shortcut 全部 9 支的来源字符串特征（识别哪支是哪支）
const { REWARD_HACKING_EN } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');
const pats = REWARD_HACKING_EN.eval_input_shortcut;
console.log('total =', pats.length);
pats.forEach((p, i) => {
  const sig = p.source.replace(/\\b|\\s\*|\\w\*|\\s\+|\(?:\?|\[|\]\{0,\d+\}|\\\)/g, '').slice(0, 70);
  console.log(`[${i}] len=${p.source.length} ${sig}`);
});
