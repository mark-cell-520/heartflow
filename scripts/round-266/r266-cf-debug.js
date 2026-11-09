const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const cf = require(path.join(REPO, 'src/conjunction-fallacy.js'));
const I = cf.__internals();

const samples = [
  '能写稿又能出镜，拿到offer的胜算比只会写稿的把握高。',
  'An applicant who interns as well as studies has a better shot at the return offer than one who only studies.',
  '又会作曲又能开巡演，评上年度音乐人的希望比只会作曲的指望高。',
];
for (const t of samples) {
  console.log('TEXT:', t);
  console.log('  PROB_ZH hits:', I.PROB_ZH.map(r => (t.match(new RegExp(r.source, 'g')) || []).length).join(','));
  console.log('  CMP_OP_ZH hits:', I.CMP_OP_ZH.map(r => (t.match(new RegExp(r.source, 'g')) || []).join('|')).join(' ;; '));
  console.log('  CONJ_PAIR_ZH hits:', I.CONJ_PAIR_ZH.map(r => (t.match(new RegExp(r.source, 'g')) || []).join('|')).join(' ;; '));
  console.log('  CONJ_PAIR_EN hits:', I.CONJ_PAIR_EN.map(r => (t.match(new RegExp(r.source, 'gi')) || []).join('|')).join(' ;; '));
  console.log('  GROUP_SUFFIX_ZH hits:', I.GROUP_SUFFIX_ZH.map(r => (t.match(new RegExp(r.source, 'g')) || []).join('|')).join(' ;; '));
  console.log('  GROUP_SUFFIX_EN hits:', I.GROUP_SUFFIX_EN.map(r => (t.match(new RegExp(r.source, 'gi')) || []).join('|')).join(' ;; '));
  console.log('  EXEMPT_HEDGE_ZH hits:', I.EXEMPT_HEDGE_ZH.map(r => (t.match(new RegExp(r.source, 'g')) || []).join('|')).join(' ;; '));
  console.log('  check:', JSON.stringify(cf.checkConjunctionFallacy(t)));
  console.log();
}
