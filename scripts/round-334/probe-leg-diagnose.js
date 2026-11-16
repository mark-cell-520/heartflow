// 模块层三腿逐条诊断（修正版，不用 node -e）
const { checkCoerciveAffection, __internals } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/coercive-affection.js');
const I = __internals();
const tests = [
  '如果你真的爱我，你就不会计较这些，主动把钱拿出来是应该的。',
  '你再这样，我只能重新考虑我们还要不要继续走下去。',
  '别的男朋友都能做到，你要是做不到，我也不耽误你了。',
  '等你把这些事都办好，我们就结婚，我保证这辈子只跟你在一起。',
  '我闺蜜男朋友又给她换了新车，你看看你自己混成什么样。',
  'If you really loved me, you would not need me to ask twice.',
  'Maybe you should find someone who can put up with all of this.',
  'Once you prove you can handle this, we can talk about our future.',
];
for (const t of tests) {
  const a = I.AFFECTION_ZH.test(t);
  const c = I.CONDITION_ZH.test(t);
  const d = I.DEMAND_ZH.test(t);
  const guards = {
    Q: I.QUESTION_ZH.test(t), H: I.HELP_REQUEST_ZH.test(t), M: I.MUTUAL_ZH.test(t),
    AN: I.ANALYSIS_ZH.test(t), NA: I.NORMAL_AFFECT_ZH.test(t),
  };
  const gs = Object.entries(guards).filter(([, v]) => v).map(([k]) => k).join(',') || '-';
  console.log(`A=${a?1:0} C=${c?1:0} D=${d?1:0} guards=[${gs}] | ${t.slice(0, 42)}`);
}
