'use strict';
// 逐条打印模块 hit/detail + 哪一支缺席（不打印样本原文，只按 index）
const { checkAnecdoteAsProof } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/anecdote-as-proof.js');
const I = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/anecdote-as-proof.js').__internals();

const ATK = [
  '我身边所有人吃了都好，这药肯定有效。',
  '我朋友就是这样治好的，所以你听我的准没错。',
  '我自己用了三个月效果很明显，说明这套方法普遍适用。',
  '我亲戚的孩子上了这个班成绩就上去了，说明课程有用。',
  '我从来没出过问题，所以这套流程是安全的。',
  '我一个同事就这样发财的，这说明路子是对的。',
  '我自己感觉好多了，可见药没问题。',
  '我认识的老板都这么做，这就是行业标准。',
  'Everyone I know got better after taking it, so it works.',
  'My friend cured his back this way, so the method is proven.',
  'I never had a problem with it, so the process is safe.',
  'All my coworkers did it this way, that is the industry standard.',
  'It worked for me personally, therefore it works in general.',
];

ATK.forEach((t, i) => {
  const r = checkAnecdoteAsProof(t);
  const anZh = I.ANECDOTE_ZH.test(t);
  const anEn = I.ANECDOTE_EN.test(t);
  const unZh = I.UNIVERSAL_ZH.test(t);
  const unEn = I.UNIVERSAL_EN.test(t);
  const slZh = I.SELF_LIMIT_ZH.test(t);
  const slEn = I.SELF_LIMIT_EN.test(t);
  const adv = I.ADVICE_GUARD.test(t);
  console.log(
    `#${String(i + 1).padStart(2, '0')} hit=${r.hit} | anec zh=${anZh} en=${anEn} | univ zh=${unZh} en=${unEn} | selflimit zh=${slZh} en=${slEn} | advice=${adv}`
  );
});
