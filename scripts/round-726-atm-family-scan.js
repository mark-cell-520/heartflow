// scripts/round-726-atm-family-scan.js —— r726 诉诸中庸谚语/俗语族攻击面扫描（增量）
const { checkArgumentToModeration } = require('../src/argument-to-moderation.js');

// [r726b] 谚语/俗语/口语和稀泥族（真实语域高频形态，非教科书句）
const ATTACK = [
  '公说公有理，婆说婆有理，其实折中才是对的。',
  '各打三十大板，两边都长长记性，这事就了了。',
  '两边都不干净，各退一步海阔天空，折中处理最合理。',
  '一个巴掌拍不响，两个人都有责任，各打五十大板才是公道。',
  '和事佬劝双方各让一步，各让一步才是最公平的结局。',
  '吵架的双方各有过错，平分责任才是公正的处理。',
  '两边的说法都有道理，取个中间数最公平。',
  '两方各执一词，各让一步，折中方案才是最优解。',
  "Let's just split the difference and call it even.",
  'The truth is somewhere in between the two claims.',
  'Both sides have a point, so the answer must lie in the middle.',
  'When in doubt, compromise is always the best policy.',
  'A little from each side is the correct way to settle this.',
  'Neither side is entirely right, so splitting the difference is fair.',
  'Meeting halfway is the rational solution to every disagreement.',
];

const BENIGN = [
  '公说公有理婆说婆有理，这句俗语说明双方各执一词，需要证据来判断。',
  '各打三十大板是旧时的说法，用来比喻不分是非、各打五十大板式的和稀泥。',
  '一个巴掌拍不响只是比喻，不代表双方责任一定相等，还是要看证据。',
  '各退一步海阔天空是劝和的话，不是判断谁对谁错的依据。',
  '和事佬的角色是促成和解，不负责裁定是非曲直。',
  '平分责任需要先认定双方过错比例，不能默认五五分。',
  '争吵双方各有过错不等于责任相等，过错比例要分别认定。',
  '两边的说法都有道理时，应当分别检验各自的证据，而不是取中。',
  'Splitting the difference is a negotiation tactic, not evidence of truth.',
  'Compromise may be necessary in politics, but it does not make a claim true.',
  'Meeting halfway is often practical, though not always the most just outcome.',
  'Neither side is entirely right, but that does not make the middle correct.',
  'The phrase 一个巴掌拍不响 is a proverb, not a logical principle.',
  "To settle a dispute fairly, weigh each side's evidence rather than splitting the difference.",
  '吵架双方各执一词时，调解员要分别询问事实经过。',
];

let hit = 0;
ATTACK.forEach((s, i) => {
  const r = checkArgumentToModeration(s);
  if (r.count > 0) hit++;
  else console.log(`MISS-A[${i}] ${s}`);
});
let fp = 0;
BENIGN.forEach((s, i) => {
  const r = checkArgumentToModeration(s);
  if (r.count > 0) { fp++; console.log(`FP-B[${i}] ${s}`); }
});
console.log(`谚语族攻击命中 ${hit}/${ATTACK.length}`);
console.log(`谚语族误伤 ${fp}/${BENIGN.length}`);
