// r243 模块层干跑：present-bias 攻击/疑难良性/边界锁/豁免/官方良性语料
const { detectPresentBias } = require('/data/home/heartflow/src/present-bias.js');

const ATTACKS_ZH = [
  '体检以后再说，今晚先痛快吃了，以后的事以后再说。',
  '明知道熬夜伤身，可凌晨的快乐是现在就有的，谁管明天怎么样。',
  '房贷三十年慢慢还，眼下先刷爆卡过上自己想要的日子。',
  '戒烟从下周开始，今天这根先抽完。',
  '未来的健康打八折，眼前的火锅一分不能少。',
  '知道存钱重要，可双十一的爽是今天的，账户里的数字是以后的事。',
  '牙疼忍到开学再说，现在的关键是先把这局游戏打完。',
  '复习明天再说，今晚的开黑就差我一个。',
  '先刷卡住进想要的房子，还款是未来自己的问题。',
  '长寿不长寿是几十年后的事，这根烟的快感现在就能拿到。',
];
const ATTACKS_EN = [
  'saving is for later, right now I need to enjoy what I can actually feel.',
  'why save for retirement when I can be happy today, the future is a discount away.',
  'I know it will hurt me later, but the pleasure is right here today.',
  'future me can deal with the consequences, I want it now.',
  'The report can wait until tomorrow; tonight I just want to party and feel good.',
  'Deadline is next week, but tonight the game is calling and I deserve to enjoy right now.',
  'My health is a problem for future me, so tonight I deserve to enjoy every bite of this dessert.',
];

const BENIGN_HARD = [
  // 正确跨期计划/自控
  '截止日期前一周开始每天做一点，比最后通宵更可靠。',
  '虽然眼前很累，但体检报告提醒我这周就去约。',
  '及时行乐也要有度，我每月固定存下收入的四成。',
  '我们知道拖延的代价，所以把大目标拆成今天就能完成的小步。',
  '从下周一开始戒糖，我已经把购物清单都换了。',
  '明天的会议材料今晚写完，免得早上手忙脚乱。',
  '先写完作业再玩，这是从小养成的习惯。',
  '今日事今日毕，晚上才能安心睡觉。',
  'commit early and reward yourself after the milestone is done.',
  'I break the goal into small steps and finish each one today.',
  'I will deal with the report now, not later, so the weekend stays free.',
  'We save automatically every month before any spending happens.',
  // 概念讨论
  'present bias is a well-documented finding in intertemporal choice research.',
  '实验预注册可以有效降低分析中的确认偏误。',
  '双曲贴现模型解释了为什么人们对即时奖励的偏好偏离指数贴现。',
  '跨期选择研究里，Thaler 和 Shefrin 的自我控制模型很有名。',
  'Present-biased preferences are common in savings and health decisions.',
  // 第三方转述/纠正
  '他总是拖到明天再说，我劝他设个闹钟把任务拆成小块。',
  'He keeps saying he will do it later, so we set a deadline for today.',
  // 单腿：只现在满足无未来贴现
  '今晚先痛快吃了，这家火锅排队也值。',
  'I want it now and I have the money to buy it today.',
  // 单腿：只未来推迟无现在满足
  '体检以后再说，最近实在抽不出时间。',
  '先记在备忘录里，下周再统一处理。',
  // 否定前缀
  '并不是现在就该享受，未来的账迟早要还。',
  '我不会再说明天再说了，今天的事今天做完。',
  'It is not that I want it now; the bill is due tomorrow and I will pay it.',
  // 既有维度领地
  '这个项目已经投了两百万，现在停掉前面的钱就全打水漂了，只能硬着头皮做完。',
  '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。',
  '以后会更好的，未来一定证明今天的坚持值得。',
  '我早就知道会这样，果不其然吧。',
  '他答应我下个月一定加薪，让我再相信他一次。',
  '今天不买就是亏，逛街不能空手回去。',
];

const BOUNDARY = [
  ['沉没成本领地', '这个项目已经投了两百万，现在停掉前面的钱就全打水漂了，只能硬着头皮做完。'],
  ['心理账户领地', '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。'],
  ['诉诸未来领地', '以后会更好的，未来一定证明今天的坚持值得。'],
  ['单腿-只现在满足', '今晚先痛快吃了，这家火锅排队也值。'],
  ['单腿-只未来推迟', '体检以后再说，最近实在抽不出时间。'],
  ['否定前缀-ZH', '并不是现在就该享受，未来的账迟早要还。'],
  ['否定前缀-EN', 'It is not that I want it now; the bill is due tomorrow and I will pay it.'],
];

// 超距（默认窗 ZH60 不命中）
const OVERDIST = '今晚先痛快吃了。' + '各'.repeat(200) + '体检以后再说。';

let bad = 0;
for (const t of ATTACKS_ZH) {
  const r = detectPresentBias(t);
  if (!r.hit) { bad++; console.log('MISS-ZH:', t, '|', r.detail); }
}
for (const t of ATTACKS_EN) {
  const r = detectPresentBias(t);
  if (!r.hit) { bad++; console.log('MISS-EN:', t, '|', r.detail); }
}
for (const t of BENIGN_HARD) {
  const r = detectPresentBias(t);
  if (r.hit) { bad++; console.log('FP:', t, '|', r.detail); }
}
for (const [k, t] of BOUNDARY) {
  const r = detectPresentBias(t);
  if (r.hit) { bad++; console.log('BOUNDARY-HIT[' + k + ']:', t); }
}
const od = detectPresentBias(OVERDIST);
if (od.hit) { bad++; console.log('OVERDIST-HIT (默认窗应不命中)'); }
if (detectPresentBias(OVERDIST, { PAIR_ZH: 500 }).hit !== true) { bad++; console.log('PAIR_ZH 放大后应命中'); }

console.log(`\n干跑结果: 攻击 ZH ${ATTACKS_ZH.length} 条 + EN ${ATTACKS_EN.length} 条；疑难良性 ${BENIGN_HARD.length} 条；边界锁 ${BOUNDARY.length} 条；超距窗 2 断言`);
console.log(bad === 0 ? '全部按预期' : `未按预期 ${bad} 处`);
