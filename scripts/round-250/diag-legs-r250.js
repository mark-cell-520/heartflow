// r250 腿诊断：逐腿打印命中情况
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkSurvivorTimeBias, __internals } = require(path.join(ROOT, 'src/survivor-time-bias.js'));

const I = __internals();
const anyHit = (list, text) => { for (const re of list) { if (re.test(text)) return true; } return false; };
const which = (list, text) => { const hits = []; for (const re of list) { if (re.test(text)) hits.push(re.source.slice(0, 50)); } return hits; };

const cases = [
  ['bare_zh', '治疗组生存期明显长于对照组，说明这个方案能延长生命'],
  ['bare_en', 'The treatment group had a longer survival period, proving the drug extends life'],
  ['mod_zh', '服用该药的患者平均多活了三年，可见这药确实有效'],
  ['inv_zh', '疗效是确凿的——吃了这个药的病人比没吃的多活了整整四年'],
  ['inv_en', 'It clearly works: those who took the medicine lived four years longer'],
  ['long_zh', '在这项回顾中，凡是坚持用完疗程的人都活了六年上下，而中途停药或从未用药的只撑了两年左右，可见坚持用药能够延命'],
  ['save_en', 'The ones on the new protocol survived eight years on average, the others only three, so the protocol saves lives'],
  ['median_en', 'Median survival reached four years in the treated arm versus one year untreated, demonstrating the intervention is effective'],
  ['other_en', 'Vaccinated patients lived ten years on average while the placebo group lived five, so the vaccine works'],
];

for (const [k, t] of cases) {
  const s1 = anyHit(I.SURVIVAL_ZH, t) || anyHit(I.SURVIVAL_EN, t);
  const s2 = anyHit(I.EFFICACY_ZH, t) || anyHit(I.EFFICACY_EN, t);
  const s3 = anyHit(I.CONTRAST_ZH, t) || anyHit(I.CONTRAST_EN, t);
  const d = anyHit(I.EXEMPT_DESIGN_ZH, t) || anyHit(I.EXEMPT_DESIGN_EN, t);
  const m = anyHit(I.EXEMPT_META_ZH, t) || anyHit(I.EXEMPT_META_EN, t);
  const r = anyHit(I.EXEMPT_RATE_ZH, t) || anyHit(I.EXEMPT_RATE_EN, t);
  console.log(k.padEnd(11), 'L1=' + (s1 ? 'Y' : 'n'), 'L2=' + (s2 ? 'Y' : 'n'), 'L3=' + (s3 ? 'Y' : 'n'),
    '| EXEMPT design=' + (d ? 'Y' : 'n'), 'meta=' + (m ? 'Y' : 'n'), 'rate=' + (r ? 'Y' : 'n'));
  if (!s1) console.log('   L1 missing');
  if (!s2) console.log('   L2 missing');
  if (!s3) console.log('   L3 missing; contrast hits EN=' + JSON.stringify(which(I.CONTRAST_EN, t).slice(0, 3)) + ' ZH=' + JSON.stringify(which(I.CONTRAST_ZH, t).slice(0, 3)));
}
