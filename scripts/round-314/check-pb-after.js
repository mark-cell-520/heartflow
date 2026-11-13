/* r314 模块自检：新腿常量登记 + 攻击族复测（改后） */
'use strict';
const PB = require('../../src/present-bias.js');
const I = PB.__internals();
console.log('NOW_ZH2:', I.NOW_ZH2.length, 'NOW_EN2:', I.NOW_EN2.length,
  'LATER_ZH2:', I.LATER_ZH2.length, 'LATER_EN2:', I.LATER_EN2.length);

const attacks = [
  '减肥下次一定，今晚这顿火锅先痛快吃了',
  '学习改天再说，现在先开黑玩两把',
  '存款等双十一买完再开始，现在先刷卡住进想要的房子',
  '锻炼说过几天再说，今晚先躺平摆烂',
  '体检年后再说，今晚先痛快吃了',
  '存钱等发工资再存，现在先犒劳自己',
  '理财过完这阵再说，现在先享受了再说',
  '运动等忙完这阵再说，现在先刷会儿视频',
  '今朝有酒今朝醉，体检以后再说',
  '能玩一天是一天，作业明天再说',
  '开心一天是一天，还款是以后的事',
  '趁还年轻及时行乐，养老是以后的问题',
  '趁现在活得痛快，谁管明天怎么样',
  '车到桥头自然直，今晚先痛快吃了',
  '相信后人的智慧，现在先舒服了',
  '儿孙自有儿孙福，现在先自己快活',
  "I'll start tomorrow, tonight I want to enjoy what I can actually feel",
  'Starting Monday for sure, this weekend I am going to party',
  'Exercise can wait, live for today and let future me handle it',
  "I'll save after this purchase, might as well enjoy it now",
  'You only live once, who cares what happens tomorrow',
  // 存量腿回归（r243 原始族）
  '今晚先痛快吃了，体检以后再说',
  '凌晨的快乐是现在就有的，谁管明天怎么样',
  'saving is for later, right now I need to enjoy what I can actually feel',
];
let hit = 0;
attacks.forEach((t, i) => {
  const r = PB.detectPresentBias(t);
  if (r.hit) hit++;
  console.log(`[${i}] ${r.hit ? 'HIT ' : 'miss'} score=${r.score} n=${r.count} | ${t.slice(0, 44)}`);
});
console.log(`\n模块命中 ${hit}/${attacks.length}`);
