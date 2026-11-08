const { __internals } = require('/data/home/heartflow/src/loss-aversion.js');
const I = __internals();
for (const k of ['AVOID_RATHER_ZH', 'AVOID_CAPITAL_ZH', 'AVOID_REFUSE_ZH', 'AVOID_EMOTION_ZH', 'AVOID_LOCKIN_ZH', 'AVOID_POSITIVE_EV_ZH', 'AVOID_POS_EV_ZH', 'AVOID_POS_EV_EN', 'AVOID_EN', 'ASYM_CMP_ZH', 'ASYM_OUTWEIGH_ZH', 'ASYM_COMPENSATE_ZH', 'ASYM_ASYMMETRY_ZH', 'ASYM_MULTIPLE_ZH', 'ASYM_EN']) {
  console.log('=== ' + k + ' ===');
  I[k].forEach((r, i) => console.log('  [' + i + '] ' + r.source));
}
