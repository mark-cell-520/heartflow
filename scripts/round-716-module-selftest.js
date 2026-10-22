/**
 * scripts/round-716-module-selftest.js
 * [r716] wishful_thinking 模块层自测：攻击全命中、良性 0 误伤。
 */
'use strict';

const { checkWishfulThinking } = require('../src/wishful-thinking.js');

const attacks = [
  // 中文攻击
  '我相信会成功，所以一定会成功',
  '只要我足够努力，宇宙就会回应我',
  '念念不忘必有回响，想什么就来什么',
  '我这么真诚，老天不会亏待我的',
  '心诚则灵，只要信念够强就能实现',
  '我这么想，事情就会按我想的发展',
  '我坚信这个项目会成功，所以它一定会实现',
  '我真心相信上天会眷顾努力的人，天道酬勤',
  '我期待好事发生，它就会发生',
  '只要我相信，它就会成真',
  // 英文攻击
  'I believe it will work out, so it will work out.',
  'If I want it badly enough, the universe will provide.',
  'My positive thinking alone will make it happen.',
  'I am convinced this will succeed, so it is bound to.',
  'I truly believe in the law of attraction, and it will manifest.',
  'I wish for success so intensely that it is destined to happen.',
  'I have faith that the cosmos will reward my efforts.',
  'My sincere hope alone will make it come true.',
  'I am sure it is meant to be, so it will happen.',
  'If I just believe hard enough, it is inevitable.',
];

const benign = [
  // 中文良性
  '我相信这个方向，但还是要看数据验证',
  '努力很重要，但结果还取决于市场环境',
  '保持积极心态有助于应对挑战，但不能替代准备',
  '愿望需要配合行动和策略才能实现',
  '信念可以给人力量，但不能改变客观规律',
  '心诚则灵是一种人生态度，不是因果机制',
  '乐观预期要建立在现实评估的基础上',
  '我相信团队的能力，我们会尽力而为',
  '期待好消息，但也要做好最坏的打算',
  '有信念是好事，但行动才是关键',
  '我对未来充满信心，因为我们已经做了充分的准备',
  // 英文良性
  'I am optimistic about the outcome, but we need to test the hypothesis.',
  'Positive thinking helps motivation, but execution matters more.',
  'I believe in the team, but we still need to validate the results.',
  'Hope is important, but action is what drives results.',
  'I have faith in the process, and the data supports our approach.',
  'Confidence comes from preparation, not just belief.',
  'I wish for the best, but I also prepare for the worst.',
  'Belief alone is not enough; we need evidence and execution.',
  'I am hopeful, but I also rely on data and testing.',
  'Optimism is good, but it must be grounded in reality.',
];

let pass = 0, fail = 0;

console.log('=== r716 wishful_thinking 模块层自测 ===\n');
console.log('--- 攻击样本（应全部命中）---');
for (const t of attacks) {
  const r = checkWishfulThinking(t);
  const ok = r.hit;
  if (ok) pass++; else fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'} [${r.hit ? 'HIT' : 'MISS'}] ${t.slice(0, 60)}`);
  if (!ok) console.log(`       detail: ${r.detail}`);
}

console.log('\n--- 良性样本（应全部不命中）---');
for (const t of benign) {
  const r = checkWishfulThinking(t);
  const ok = !r.hit;
  if (ok) pass++; else fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'} [${r.hit ? 'HIT' : 'MISS'}] ${t.slice(0, 60)}`);
  if (!ok) console.log(`       detail: ${r.detail}`);
}

console.log(`\n=== 结果: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
