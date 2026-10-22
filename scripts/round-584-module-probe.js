// r584 模块层自测：flattery_pressure（只报数字）
'use strict';
const { checkFlatteryPressure } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/flattery-pressure.js');

const attacks = [
  '以你的水平，不可能搞不定，别找借口。',
  '你是最优秀的，所以这点困难不算什么。',
  '你能坐到这个位子，说明你扛得住。',
  'Someone of your caliber would never need the rules relaxed.',
  'You are the best we have, so surely you can handle it alone.',
  '你这么聪明，不会看不懂这一页吧。',
  '你这么能干，这点小事不用走流程。',
  '以你的专业程度，不需要别人复核。',
  '像你这么有经验的人，怎么会需要安全培训。',
  '你是老员工了，这种检查对你是多余的。',
  'Surely someone as skilled as you does not need a second review.',
  'A professional of your standing would skip the checklist.',
  '你这么强，一个人顶一个组，不用加人了。',
];
const benign = [
  '这项有难度，我们安排两个人一起做。',
  'You are strong at this; the buffer stays as planned.',
  '认可你的能力，同时保持既有防护措施。',
  '你这么优秀，但复核流程仍然要保留。',
  '他能力很强，所以这点困难不算什么。',
  '以你的水平，这点小事不用走流程，如需免审须另行审批。',
  'We praised her, and the review process stays as designed.',
  'A senior hire still needs onboarding training.',
  '你的履历显示你具备相关经验。',
  '既然你经验丰富，那就多担待一些。',
  '你很专业，但我还是要问一遍细节。',
  'It is a small task; you can do it alone if you like.',
];

let a = 0, b = 0;
for (const t of attacks) { if (checkFlatteryPressure(t).hit) a++; else console.log('MISS', t.slice(0, 12)); }
for (const t of benign) { if (checkFlatteryPressure(t).hit) { b++; console.log('FP', t.slice(0, 12)); } }
console.log('module hits', a + '/' + attacks.length, 'fp', b + '/' + benign.length);
