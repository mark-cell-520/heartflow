const { detectLossAversion } = require('/data/home/heartflow/src/loss-aversion.js');
const ZH = [
  '同样的数目，赔一块比挣一块难受多了，所以先保本',
  '同幅度的亏损比盈利更让人难受，因此我从不参与',
  '亏一万比赚一万更疼，所以我选择不出手',
  '赚一千的开心压不住亏一千的心疼，宁可什么都不做',
  '赚一万的快乐抵不过亏一万的心疼，我选择不出手',
  '亏一万的心疼大于赚一万的快乐，所以我先保本',
  '亏一万的痛苦得赚两万才能补回来，所以能不冒险就不冒险',
  '涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等',
  '得失根本不对等，所以我只做保本的事',
  '亏损的痛苦是收益的两倍，所以这个正期望的项目我不投',
  '损失的痛苦是收益的两倍，所以哪怕期望为正我也不碰',
  '宁可少赚也不能亏，这是我一贯的规矩',
  '少赚点无所谓，亏一点就受不了',
  '只要不亏，少挣多少都能接受；一想到要亏，给多少补偿都不干',
  '想到可能亏就睡不着，哪怕期望是正的也不碰',
  '一想到可能亏就睡不着，所以我坚决不碰',
  '亏一点就心慌，我选择躺平',
  '亏一万比赚一万难受多了，所以宁可什么都不做',
];
const EN = [
  'The joy of gaining a thousand does not offset the pain of losing one, so do nothing',
  'I would rather earn less than risk a loss; avoiding losses comes first',
  'A loss hurts about twice as much as an equal gain pleases, so stay defensive',
  'Even with a positive expected value, the fear of losing keeps me out',
  'Losing a hundred stings far more than winning a hundred thrills, so I sit out',
  'A missed gain is only a missed gain, but a realized loss feels like a wound',
  'The pain of a loss is about twice as large as the pleasure of an equal gain, so I pass on it',
  'Losses loom larger than equal gains, so I keep the principal first',
  'Gains and losses are not symmetric, therefore I never risk what I already have',
  'Losing a hundred stings far more than winning a hundred thrills, so I stay defensive',
  'The pain of losing is twice the pleasure of gaining, so I protect the downside first',
  'I cannot stomach a loss, so I stay out of the market',
  'I would rather earn less than risk a loss',
  'I never risk what I already have',
  'A realized loss feels like a wound, so I sit it out',
];
const NO_ASYM = { ASYM_CMP_ZH: [], ASYM_OUTWEIGH_ZH: [], ASYM_COMPENSATE_ZH: [], ASYM_ASYMMETRY_ZH: [], ASYM_MULTIPLE_ZH: [], ASYM_EN: [] };
const NO_AVOID = { AVOID_RATHER_ZH: [], AVOID_CAPITAL_ZH: [], AVOID_REFUSE_ZH: [], AVOID_EMOTION_ZH: [], AVOID_LOCKIN_ZH: [], AVOID_POSITIVE_EV_ZH: [], AVOID_POS_EV_ZH: [], AVOID_POS_EV_EN: [], AVOID_EN: [] };
const NO_SOLO = { SOLO_ZH: [], SOLO_EN: [] };
function kind(t) {
  const a = detectLossAversion(t).hit;
  const b = detectLossAversion(t, NO_ASYM).hit;
  const c = detectLossAversion(t, NO_AVOID).hit;
  const d = detectLossAversion(t, NO_SOLO).hit;
  if (!a) return 'NO-HIT!';
  if (b) return 'SOLO-only';
  if (c) return 'ASYM-only(no avoid leg!)';
  if (!d) return 'SOLO-only(2)';
  return '2-leg';
}
console.log('--- ZH ---');
for (const t of ZH) console.log(kind(t).padEnd(22) + ' | ' + t);
console.log('--- EN ---');
for (const t of EN) console.log(kind(t).padEnd(22) + ' | ' + t);
