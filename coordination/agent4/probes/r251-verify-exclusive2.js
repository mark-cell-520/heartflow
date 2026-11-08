const { detectLossAversion } = require('/data/home/heartflow/src/loss-aversion.js');
const NO_SOLO = { SOLO_ZH: [], SOLO_EN: [] };
const CAND = {
  AVOID_POSITIVE_EV_ZH: ['同幅度的亏损比盈利更难受，所以哪怕期望为正我也不为所动'],
  AVOID_POS_EV_EN: ['A loss hurts twice as much as an equal gain pleases; even with a positive expected value I would not commit capital'],
};
const KEYS = { AVOID_POSITIVE_EV_ZH: 'AVOID_POSITIVE_EV_ZH', AVOID_POS_EV_EN: 'AVOID_POS_EV_EN' };
for (const g of Object.keys(CAND)) {
  const inj = Object.assign({ [g]: [] }, NO_SOLO);
  for (const t of CAND[g]) {
    console.log(g + ' | default=' + detectLossAversion(t).hit + ' 删本族=' + detectLossAversion(t, inj).hit + ' | ' + t);
  }
}
