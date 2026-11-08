const { __internals } = require('/data/home/heartflow/src/loss-aversion.js');
const I = __internals();
const t = '赚一千的开心压不住亏一万的心疼，宁可什么都不做';
console.log('TEXT:', t);
for (const g of ['AVOID_RATHER_ZH', 'AVOID_CAPITAL_ZH', 'AVOID_REFUSE_ZH', 'AVOID_EMOTION_ZH', 'AVOID_LOCKIN_ZH', 'AVOID_POSITIVE_EV_ZH', 'AVOID_POS_EV_ZH']) {
  const hits = [];
  I[g].forEach((r, i) => { const m = t.match(r); if (m) hits.push('[' + i + ']@' + m.index + ' ' + JSON.stringify(m[0])); });
  console.log(g + ': ' + (hits.join(' ; ') || '-'));
}
for (const g of ['ASYM_CMP_ZH', 'ASYM_OUTWEIGH_ZH']) {
  const hits = [];
  I[g].forEach((r, i) => { const m = t.match(r); if (m) hits.push('[' + i + ']@' + m.index + ' ' + JSON.stringify(m[0])); });
  console.log(g + ': ' + (hits.join(' ; ') || '-'));
}
