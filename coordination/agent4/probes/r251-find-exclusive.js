const { detectLossAversion, __internals } = require('/data/home/heartflow/src/loss-aversion.js');
const I = __internals();
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
  '同幅度的亏损比盈利更难受，所以我躺平',
  '同幅度的亏损比盈利更难受，所以我退出',
  '同幅度的亏损比盈利更难受，所以我锁仓不动',
  '同幅度的亏损比盈利更难受，所以我落袋为安',
  '同幅度的亏损比盈利更难受，所以我不加仓',
  '同幅度的亏损比盈利更难受，所以我不参与',
  '同幅度的亏损比盈利更难受，所以我不出手',
  '同幅度的亏损比盈利更难受，所以我不冒险',
  '同幅度的亏损比盈利更难受，所以哪怕期望为正我也不碰',
  '同幅度的亏损比盈利更难受，所以这个正期望的项目我不投',
  '同幅度的亏损比盈利更难受，所以我选择观望',
  '同幅度的亏损比盈利更难受，所以我原地不动',
  '同幅度的亏损比盈利更难受，所以我宁可不赚',
  '同幅度的亏损比盈利更难受，所以我不碰它',
  '同幅度的亏损比盈利更难受，所以我放着不动',
  '同幅度的亏损比盈利更难受，所以我空仓等着',
  '同幅度的亏损比盈利更难受，所以我缩手缩脚',
  '同幅度的亏损比盈利更难受，所以我躲开这个局',
];
const EN = [
  'A loss hurts about twice as much as an equal gain pleases, so stay defensive',
  'Losing a hundred stings far more than winning a hundred thrills, so I sit out',
  'The pain of a loss is about twice as large as the pleasure of an equal gain, so I pass on it',
  'Losses loom larger than equal gains, so I keep the principal first',
  'Losing a hundred stings far more than winning a hundred thrills, so I stay defensive',
  'The pain of losing is twice the pleasure of gaining, so I protect the downside first',
  'A loss hurts twice as much as an equal gain pleases, so I do nothing',
  'A loss hurts twice as much as an equal gain pleases, so I pass on it',
  'A loss hurts twice as much as an equal gain pleases, so I stay out',
  'A loss hurts twice as much as an equal gain pleases, so I sit it out',
  'A loss hurts twice as much as an equal gain pleases, so I keep it in cash',
  'A loss hurts twice as much as an equal gain pleases, so I keep the principal first',
  'A loss hurts twice as much as an equal gain pleases, so I skip it',
  'A loss hurts twice as much as an equal gain pleases, so I decline',
  'A loss hurts twice as much as an equal gain pleases, so I stay defensive',
  'A loss hurts twice as much as an equal gain pleases, so I play it safe',
  'A loss hurts twice as much as an equal gain pleases, so I stay on the sidelines',
  'A loss hurts twice as much as an equal gain pleases, so I avoid the deal',
  'A loss hurts twice as much as an equal gain pleases, so I walk away',
  'A loss hurts twice as much as an equal gain pleases, so I refuse it',
  'A loss hurts twice as much as an equal gain pleases, so I stay away',
  'A loss hurts twice as much as an equal gain pleases, so I withdraw',
  'A loss hurts twice as much as an equal gain pleases, so I never risk what I have',
];
const ASYM_KEYS = ['ASYM_CMP_ZH', 'ASYM_OUTWEIGH_ZH', 'ASYM_COMPENSATE_ZH', 'ASYM_ASYMMETRY_ZH', 'ASYM_MULTIPLE_ZH', 'ASYM_EN'];
const AVOID_KEYS = ['AVOID_RATHER_ZH', 'AVOID_CAPITAL_ZH', 'AVOID_REFUSE_ZH', 'AVOID_EMOTION_ZH', 'AVOID_LOCKIN_ZH', 'AVOID_POSITIVE_EV_ZH', 'AVOID_POS_EV_ZH', 'AVOID_POS_EV_EN', 'AVOID_EN'];
function finder(keys, corpus) {
  for (const g of keys) {
    const inj = {}; inj[g] = [];
    const ok = corpus.filter(t => detectLossAversion(t).hit && !detectLossAversion(t, inj).hit);
    console.log(g + ' -> ' + (ok.length ? ok[0] : '(无独占句)'));
  }
}
console.log('=== ASYM 独占句 ==='); finder(ASYM_KEYS, ZH.concat(EN));
console.log('=== AVOID 独占句 ==='); finder(AVOID_KEYS, ZH.concat(EN));
console.log('=== W0 负例可用句 ===');
for (const t of ZH) if (!detectLossAversion(t, { W_ZH: 0 }).hit) console.log('  ZH | ' + t);
for (const t of EN) if (!detectLossAversion(t, { W_EN: 0 }).hit) console.log('  EN | ' + t);
