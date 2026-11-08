const { detectLossAversion, __internals } = require('/data/home/heartflow/src/loss-aversion.js');
const I = __internals();
const t = '同幅度的亏损比盈利更难受，所以哪怕期望为正我也不为所动';
const NO_SOLO = { SOLO_ZH: [], SOLO_EN: [] };
console.log('default hit:', detectLossAversion(t).hit);
for (const g of ['AVOID_RATHER_ZH', 'AVOID_CAPITAL_ZH', 'AVOID_REFUSE_ZH', 'AVOID_EMOTION_ZH', 'AVOID_LOCKIN_ZH', 'AVOID_POSITIVE_EV_ZH', 'AVOID_POS_EV_ZH']) {
  const hits = [];
  I[g].forEach((r, i) => { const m = t.match(r); if (m) hits.push('[' + i + '] ' + JSON.stringify(m[0])); });
  console.log(g + ': ' + (hits.join(' ; ') || '-'));
}
console.log('SOLO_ZH 命中:');
I.SOLO_ZH.forEach((r, i) => { const m = t.match(r); if (m) console.log('  [' + i + '] ' + JSON.stringify(m[0])); });
