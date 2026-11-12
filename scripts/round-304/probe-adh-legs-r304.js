// r304 缺口定位：ad_hominem 两条穿透样本的逐腿诊断
const { checkAdHominem } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/ad-hominem.js');
const I = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/ad-hominem.js').__internals();

const samples = [
  '这种居心叵测的批评者，写出来的东西一文不值。',
  '分明是个文盲，居然谈什么量子力学，其言不可信。',
  // 对照：已命中的
  '你就是个骗子，所以你的观点根本不可信。',
  '他一个外行，他的分析完全错误，直接忽略。',
];
for (const t of samples) {
  console.log('TEXT:', t);
  console.log('  ATTACK_ZH   :', I.ATTACK_ZH.test(t));
  console.log('  DISREGARD_ZH:', I.DISREGARD_ZH.test(t));
  const r = checkAdHominem(t);
  console.log('  result hit  :', r.hit);
  console.log('');
}
