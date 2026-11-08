const { detectLossAversion } = require('/data/home/heartflow/src/loss-aversion.js');
const NO_AVOID = { AVOID_RATHER_ZH: [], AVOID_CAPITAL_ZH: [], AVOID_REFUSE_ZH: [], AVOID_EMOTION_ZH: [], AVOID_LOCKIN_ZH: [], AVOID_POSITIVE_EV_ZH: [], AVOID_POS_EV_ZH: [], AVOID_POS_EV_EN: [], AVOID_EN: [] };
const ZH = [
  '同样的数目，赔一块比挣一块难受多了，所以先保本',
  '同幅度的亏损比盈利更让人难受，因此我从不参与',
  '亏一万比赚一万更疼，所以我选择不出手',
  '赚一千的开心压不住亏一万的心疼，宁可什么都不做',
  '赚一万的快乐抵不过亏一万的心疼，我选择不出手',
  '亏一万的心疼大于赚一万的快乐，所以我先保本',
  '亏一万的痛苦得赚两万才能补回来，所以能不冒险就不冒险',
  '涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等',
  '得失根本不对等，所以我只做保本的事',
  '亏损的痛苦是收益的两倍，所以这个正期望的项目我不投',
  '亏一万比赚一万难受多了，所以宁可什么都不做',
  '先保本，因为亏一万比赚一万难受多了',
];
console.log('=== 删 AVOID_RATHER_ZH 后仍命中的（说明还有别的避损腿）===');
for (const t of ZH) {
  const inj = { AVOID_RATHER_ZH: [] };
  if (detectLossAversion(t, inj).hit) console.log('  STILL | ' + t);
}
console.log('=== W_ZH=0 后仍命中的（说明双腿重叠，dist=0）===');
for (const t of ZH) {
  if (detectLossAversion(t, { W_ZH: 0 }).hit) console.log('  STILL | ' + t);
}
console.log('=== W_ZH=0 后失配的（可用于距离窗负例）===');
for (const t of ZH) {
  if (!detectLossAversion(t, { W_ZH: 0 }).hit) console.log('  KILLED| ' + t);
}
