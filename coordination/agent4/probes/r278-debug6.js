const fdMod = require('/data/home/heartflow/src/false-dilemma.js');
const atMod = require('/data/home/heartflow/src/appeal-tradition.js');
const F = fdMod.__internals(), A = atMod.__internals();
const STIGMA_ZH_N1 = '(?:不是|算不上|不算|绝非)(?:[^，。？！；\\n]{0,10}?)[，,]?(?:就是|便是|即|等于)(?:[^，.？！；\\n]{0,12}?)(?:敌人|仇人|陌路|对头|叛徒|奸细|间谍|坏人|恶人|人渣|垃圾|废物|走狗|卖国贼)';
console.log('n1 idx:', F.STIGMA_ZH.source.indexOf(STIGMA_ZH_N1));
console.log('source snippet:', F.STIGMA_ZH.source.slice(-400));
console.log('---- appeal e13 debug ----');
const s = 'My family has done it this way for generations, and I see no reason to stop.';
console.log('hit before:', atMod.checkAppealToTradition(s).hit);
const CB = Object.assign({}, A.CONCL_EN_BRANCHES, { e13_no_reason: /(?!x)x/ });
console.log('hit after e13 kill:', atMod.checkAppealToTradition(s, { CONCL_EN_BRANCHES: CB }).hit);
console.log('CONCL_EN keys:', Object.keys(A.CONCL_EN_BRANCHES).join(','));
for (const [k, re] of Object.entries(A.CONCL_EN_BRANCHES)) {
  const m = s.match(re);
  if (m) console.log('  match', k, JSON.stringify(m[0]), m.index);
}
for (const [k, re] of Object.entries(A.TRAD_EN_BRANCHES)) {
  const m = s.match(re);
  if (m) console.log('  trad match', k, JSON.stringify(m[0]), m.index);
}
console.log('TRADITION_EN match:', JSON.stringify((s.match(A.TRADITION_EN) || [])[0]));
