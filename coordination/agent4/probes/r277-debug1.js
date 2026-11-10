const m = require('/data/home/heartflow/src/appeal-tradition.js');
const s = '这牌子立了上百年，口碑摆在那儿，照老方子来。';
console.log(JSON.stringify(m.checkAppealToTradition(s)));
const I = m.__internals();
for (const k of ['TRAD_ZH_BRANCHES', 'CONCL_ZH_BRANCHES', 'SUPP_ZH_BRANCHES']) {
  for (const [name, re] of Object.entries(I[k] || {})) {
    const mm = s.match(re);
    if (mm) console.log(k, name, JSON.stringify(mm[0]), mm.index);
  }
}
console.log('TRADITION_ZH:', JSON.stringify((s.match(I.TRADITION_ZH) || [])[0]));
console.log('HEDGE_EV:', s.match(I.HEDGE_EVIDENCE_ZH));
