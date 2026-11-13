/* r314 元素级归因：每条候选样本的火力来自哪些腿（存量/新元素逐条） */
'use strict';
const PB = require('../../src/present-bias.js');
const EE = require('../../src/endowment-effect.js');
const pbi = PB.__internals();
const eei = EE.__internals();

// present-bias 侧：单腿族 × 元素
function pbFire(text) {
  const out = {};
  const legs = {
    NOW_ZH: pbi.NOW_ZH, NOW_ZH2: pbi.NOW_ZH2,
    LATER_ZH: pbi.LATER_ZH, LATER_ZH2: pbi.LATER_ZH2,
    NOW_EN: pbi.NOW_EN, NOW_EN2: pbi.NOW_EN2,
    LATER_EN: pbi.LATER_EN, LATER_EN2: pbi.LATER_EN2,
  };
  for (const k of Object.keys(legs)) {
    legs[k].forEach((re, i) => { const m = re.exec(text); if (m) out[`${k}[${i}]`] = m[0]; });
  }
  return out;
}
// endowment 侧：OWN/INFLATE/REFUSE × 元素（含否定守卫）
function eeFire(text) {
  const out = {};
  const lists = {
    OWN_ZH: eei.OWN_ZH, OWN_ZH2: eei.OWN_ZH2,
    OWN_EN: eei.OWN_EN, OWN_EN2: eei.OWN_EN2,
    INFLATE_ZH: eei.INFLATE_ZH, INFLATE_ZH2: eei.INFLATE_ZH2,
    INFLATE_EN: eei.INFLATE_EN, INFLATE_EN2: eei.INFLATE_EN2,
    REFUSE_ZH: eei.REFUSE_ZH, REFUSE_ZH2: eei.REFUSE_ZH2,
    REFUSE_EN: eei.REFUSE_EN, REFUSE_EN2: eei.REFUSE_EN2,
  };
  for (const k of Object.keys(lists)) {
    lists[k].forEach((re, i) => {
      const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let m;
      while ((m = reG.exec(text)) !== null) {
        if (m.index === reG.lastIndex) reG.lastIndex++;
        out[`${k}[${i}]`] = m[0];
        break;
      }
    });
  }
  return out;
}

const samples = process.argv[2] === 'ee' ? [
  '老房子是父亲留给我的，情义无价，卖价再高也不考虑',
  '我的旧车开了二十年，千金不换，这卖价我不认',
  '这块表是我戴了半辈子的，什么都替代不了，这卖价我不认',
  '这猫我看着长大的，千金不换，卖价免谈',
  '自己家的宅基地，千金不换，卖价免谈',
  '宅基地是祖祖辈辈传下来的，千金不换，卖价免谈',
  '咱家的宅基地，千金不换，卖价免谈',
  '这幅画亲手画的，千金不换，卖价免谈',
  '这把吉他是我的，陪了我十年，这不是钱的事',
  '自己家的宅基地，祖祖辈辈传下来的，不是钱能衡量的',
  'Built this from nothing, and no price could ever be enough',
  'I started it from scratch, and no price could ever be enough',
  'I watched it grow up, so no price could ever be enough',
  'My first guitar is irreplaceable to me, and the market price is irrelevant',
  'The old shop is ours, we built it from nothing, money cannot buy what it means to us',
  'This watch is mine, I have had it for thirty years, it is not for all the money in the world',
  "I would not trade it for anything, my grandfather's desk means more than any market price",
  "My grandfather's desk — you cannot put a price on it, and no offer has ever been enough",
  // 存量回归样本
  '这把吉他是我的，陪了我十年，别说三千，五千我都不卖',
  '我的旧车虽然市价只值两万，但对我而言它值五万，低于这个价免谈',
  'This watch is mine, I have had it for twenty years, no amount under ten thousand will buy it.',
] : [
  '今朝有酒今朝醉，体检以后再说',
  '能玩一天是一天，作业明天再说',
  '趁还年轻及时行乐，养老是以后的问题',
  '儿孙自有儿孙福，先快活了再说',
  '相信后人的智慧，现在先自己舒服一把',
  '锻炼今后再开始，今晚先痛快吃了',
  '减肥下次一定，今晚这顿火锅先痛快吃了',
  '存款等双十一买完再开始，现在先刷卡住进想要的房子',
  '车到桥头自然直，今晚先痛快吃了',
  '相信后人的智慧，现在先舒服了',
  '儿孙自有儿孙福，现在先自己快活',
  '体检到时候再说，今晚先痛快吃了',
  "I'll start tomorrow, tonight I want to enjoy what I can actually feel",
  'Starting Monday for sure, this weekend I am going to party',
  'Quitting smoking next time for sure, tonight I will enjoy one more cigarette',
  "I'll save after this purchase, might as well enjoy it now",
  'You only live once, who cares what happens tomorrow',
  'We will cross that bridge when we come to it, so tonight let us be happy',
  'Dieting can wait, seize the day and deal with it later',
  'He says carpe diem, the deadline can wait until tomorrow',
  'Saving is for later, I will enjoy it while I can',
  'Retirement planning can wait, we should travel while we are young',
  'Exercise can wait, live for today and let future me handle it',
  // 存量回归
  '今晚先痛快吃了，体检以后再说',
];
for (const s of samples) {
  const f = process.argv[2] === 'ee' ? eeFire(s) : pbFire(s);
  console.log(s.slice(0, 40), '=>', JSON.stringify(f));
}
