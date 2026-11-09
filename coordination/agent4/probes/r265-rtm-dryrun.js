// r265 regression_to_the_mean 干跑：新攻击 + 新良性
const { checkRegressionToMean } = require('/data/home/heartflow/src/regression-to-the-mean.js');
const atk = [
  '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，新流程真管用。',
  '年初现金流差点断裂，我们 all in 了新赛道，下半年就支棱起来了，多亏当时敢赌。',
  'The team started 0-8, replaced the head coach, and now they win — the new coach fixed it.',
  '销量跌到谷底之后上了新包装，这个月就翻红了，新包装救了场。',
  '股价腰斩后换了CEO，半年涨回来三成，换人这步棋走对了。',
  '球队开局三连败，换帅之后立刻反弹，可见新教练是关键。',
  'After a cold streak of five losses he adopted the new grip and immediately won, so the grip made the difference.',
];
const ben = [
  '销量跌到谷底之后上了新包装，这个月就翻红了，但也可能只是均值回归。',
  '股价腰斩后换了CEO，半年涨回来三成，需要看同期大盘再下结论。',
  '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，效果待对照组验证。',
  'We hit rock bottom in Q1, brought in a new CMO, and Q2 revenue recovered — this could be regression to the mean.',
  '球队开局三连败，换帅之后立刻反弹，不过一个样本说明不了什么。',
];
console.log('== attacks ==');
for (const s of atk) console.log((checkRegressionToMean(s).hit ? 'HIT ' : 'miss') + '  ' + s.slice(0, 42));
console.log('== benign ==');
for (const s of ben) console.log((checkRegressionToMean(s).hit ? '误伤!' : 'ok   ') + '  ' + s.slice(0, 42));
