const { detectLossAversion, __internals } = require('/data/home/heartflow/src/loss-aversion.js');
const I = __internals();
const NO_ASYM = { ASYM_CMP_ZH: [], ASYM_OUTWEIGH_ZH: [], ASYM_COMPENSATE_ZH: [], ASYM_ASYMMETRY_ZH: [], ASYM_MULTIPLE_ZH: [], ASYM_EN: [] };
const NO_AVOID = { AVOID_RATHER_ZH: [], AVOID_CAPITAL_ZH: [], AVOID_REFUSE_ZH: [], AVOID_EMOTION_ZH: [], AVOID_LOCKIN_ZH: [], AVOID_POSITIVE_EV_ZH: [], AVOID_POS_EV_ZH: [], AVOID_POS_EV_EN: [], AVOID_EN: [] };
const NO_BOTH = Object.assign({}, NO_ASYM, NO_AVOID);
const CAND = [
  '宁可少赚也不能亏，这是我一贯的规矩',
  '少赚点无所谓，亏一点就受不了',
  '只要不亏，少挣多少都能接受',
  '只要不亏，少挣多少都能接受，这就是我的原则',
  '一想到要亏，给多少补偿都不干',
  '损失的痛苦是收益的两倍，所以哪怕期望为正我也不碰',
  '一想到可能亏就睡不着，什么正期望都拉不回我',
  '一想到可能亏就睡不着',
  '亏一点就心慌，我选择躺平',
  '亏一点就心慌',
];
const CAND_EN = [
  'I would rather earn less than risk a loss',
  'I would rather earn less than risk a loss; avoiding losses comes first',
  'Even with a positive expected value, the fear of losing keeps me out',
  'The joy of gaining a thousand does not offset the pain of losing one, so do nothing',
  'A missed gain is only a missed gain, but a realized loss feels like a wound',
  'Gains and losses are not symmetric, therefore I never risk what I already have',
  'I cannot stomach a loss, so I stay out of the market',
  'I cannot stomach a loss',
  'I never risk what I already have',
  'A realized loss feels like a wound, so I sit it out',
  'A realized loss feels like a wound',
  'I can\'t stomach a loss, so I sit it out',
  'a missed gain is just a missed gain',
  'I cannot bear a loss',
  'The dread of losing holds me out',
];
const NOBOTH = Object.assign({}, NO_ASYM, NO_AVOID);
function dep(list, key, cands) {
  console.log('=== ' + key + ' (' + list.length + ') ===');
  for (let i = 0; i < list.length; i++) {
    const inj = Object.assign({ [key]: list.slice(0, i).concat(list.slice(i + 1)) }, NOBOTH);
    const ok = cands.filter(t => detectLossAversion(t, NOBOTH).hit && !detectLossAversion(t, inj).hit);
    console.log('[' + i + '] ' + (ok.length ? 'OK  ' + ok[0] : '(无独占句)'));
  }
}
dep(I.SOLO_ZH, 'SOLO_ZH', CAND);
dep(I.SOLO_EN, 'SOLO_EN', CAND_EN);
