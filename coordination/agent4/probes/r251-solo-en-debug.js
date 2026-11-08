const { detectLossAversion, __internals } = require('/data/home/heartflow/src/loss-aversion.js');
const I = __internals();
const NO_ASYM = { ASYM_CMP_ZH: [], ASYM_OUTWEIGH_ZH: [], ASYM_COMPENSATE_ZH: [], ASYM_ASYMMETRY_ZH: [], ASYM_MULTIPLE_ZH: [], ASYM_EN: [] };
const NO_AVOID = { AVOID_RATHER_ZH: [], AVOID_CAPITAL_ZH: [], AVOID_REFUSE_ZH: [], AVOID_EMOTION_ZH: [], AVOID_LOCKIN_ZH: [], AVOID_POSITIVE_EV_ZH: [], AVOID_POS_EV_ZH: [], AVOID_POS_EV_EN: [], AVOID_EN: [] };
const NOBOTH = Object.assign({}, NO_ASYM, NO_AVOID);
const CAND_EN = ['I would rather earn less than risk a loss', 'I would rather earn less than risk a loss; avoiding losses comes first', 'The dread of losing holds me out', 'the fear of losing keeps me away', 'a fear of losing keeps me out of the deal'];
for (const t of CAND_EN) {
  const base = detectLossAversion(t, NOBOTH).hit;
  const idxs = [];
  for (let i = 0; i < I.SOLO_EN.length; i++) {
    if (I.SOLO_EN[i].test(t)) idxs.push(i);
  }
  console.log((base ? 'HIT ' : 'MISS') + ' soloIdx=' + JSON.stringify(idxs) + ' | ' + t);
}
