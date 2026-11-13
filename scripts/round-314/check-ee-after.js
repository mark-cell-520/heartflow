/* r314 模块自检：endowment-effect 新腿攻击族 + 存量腿回归 + 良性 */
'use strict';
const EE = require('../../src/endowment-effect.js');
const I = EE.__internals();
console.log('OWN_ZH2:', I.OWN_ZH2.length, 'OWN_EN2:', I.OWN_EN2.length,
  'INFLATE_ZH2:', I.INFLATE_ZH2.length, 'INFLATE_EN2:', I.INFLATE_EN2.length);

const attacks = [
  '这把吉他是我的，陪了我十年，这不是钱的事',
  '老房子是父亲留给我的，情义无价，给多少都不卖',
  '这幅画是我亲手画的，感情无价，出多少都不换',
  '我的旧车开了二十年，千金不换，低于这个价免谈',
  '这块表是我戴了半辈子的，什么都替代不了，买不走',
  '咱家的老作坊是我一手经营起来的，万金不换，说什么都不卖',
  '这只猫是我看着长大的，给多少钱我都换不来',
  '自己家的宅基地，祖祖辈辈传下来的，不是钱能衡量的',
  'This watch is mine, I have had it for thirty years, it is not for all the money in the world',
  "My grandfather's desk — you cannot put a price on it, and I would not trade it for anything",
  'My first guitar is irreplaceable to me, no price could ever be enough',
  'The old shop is ours, we built it from nothing, money cannot buy what it means to us',
  // 存量腿回归（r241 原始族）
  '这把吉他是我的，陪了我十年，别说三千，五千我都不卖',
  '我的旧车虽然市价只值两万，但对我而言它值五万，低于这个价免谈',
  'This watch is mine, I have had it for twenty years, no amount under ten thousand will buy it.',
  'He would not sell his grandfather\'s desk at any market price.',
];
let hit = 0;
attacks.forEach((t, i) => {
  const r = EE.detectEndowmentEffect(t);
  if (r.hit) hit++;
  console.log(`[${i}] ${r.hit ? 'HIT ' : 'miss'} score=${r.score} n=${r.count} | ${t.slice(0, 44)}`);
});
console.log(`\n模块命中 ${hit}/${attacks.length}`);

const benign = [
  '按市场价挂牌，专业估价作依据，该卖就卖',
  '虽然陪了我很多年，但情感估值不能作为定价依据',
  '留着自住，短期内不打算交易',
  '禀赋效应是 Thaler 提出的经典现象，教学中常用马克杯实验说明',
  'It is worth exactly what the appraiser said, sell at market value',
  'Keeping it for personal use, no plan to sell anytime soon',
  '这个项目不是我一个人做的，是团队的心血，按合同分工分配收益',
  'We built it from nothing, so we know exactly what it is worth on the market',
];
let clean = 0;
benign.forEach((t, i) => {
  const r = EE.detectEndowmentEffect(t);
  if (!r.hit) clean++;
  console.log(`B[${i}] ${r.hit ? 'HIT!' : 'pass'} | ${t.slice(0, 44)}`);
});
console.log(`\n良性零误伤 ${clean}/${benign.length}`);
