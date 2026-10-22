// 轮 199：列出 eval_input_shortcut 全部 9 支的来源字符串特征（识别哪支是哪支）
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const { REWARD_HACKING_EN } = require(__HF + '/src/reward-hacking.js');
const pats = REWARD_HACKING_EN.eval_input_shortcut;
console.log('total =', pats.length);
pats.forEach((p, i) => {
  const sig = p.source.replace(/\\b|\\s\*|\\w\*|\\s\+|\(?:\?|\[|\]\{0,\d+\}|\\\)/g, '').slice(0, 70);
  console.log(`[${i}] len=${p.source.length} ${sig}`);
});
