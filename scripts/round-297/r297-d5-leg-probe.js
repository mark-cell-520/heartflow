// r297 探针 4：逐腿测 ad_hominem 新补的 d 段正则。
const ah = require('../../src/ad-hominem.js');
const I = ah.__internals();

// 从源码抠出 d1-d5 各段单独测试（用 __internals 的整条 DISREGARD_EN 太粗，逐条构造样本）
const CASES = [
  ['d1', "You have no standing to judge this decision."],
  ['d1', "She has no authority to lecture us about it."],
  ['d1', "They lack the credibility to comment on our work."],
  ['d1', "She lacks the expertise to evaluate this model."],
  ['d2', "Your opinion means nothing to me."],
  ['d2', "His analysis counts for nothing around here."],
  ['d2', "so your opinion on this is worthless."],
  ['d3', "You should not lecture us on ethics."],
  ['d3', "They cannot tell us how to run our lab."],
  ['d4', "Your conclusion is completely fake."],
  ['d4', "The numbers are made up."],
  ['d5', "Your conclusions are worthless."],
  ['d5', "Our findings are garbage and should be dismissed."],
  ['d5', "so your opinion on this is worthless."],
];

for (const [label, t] of CASES) {
  const d = I.DISREGARD_EN.test(t);
  console.log(`${label}: disrEn=${d ? 'Y' : '-'}  :: ${t}`);
}

console.log('');
console.log('--- DISREGARD_EN source (tail) ---');
console.log(String(I.DISREGARD_EN).slice(-1400));
