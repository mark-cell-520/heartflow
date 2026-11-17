'use strict';
const { detectSignificanceVerdictMisread, __internals } = require('../../src/significance-verdict-misread.js');
const I = __internals();
const cases = [
  'The finding fell just short of significance but the direction supports our theory.',
  'p = 0.32 indicates no association between the variables, so the hypothesis is refuted.',
  'Because the test was not significant we can conclude there is no effect.',
  '差异虽未达显著，但已接近显著阈值，方向符合预期。',
];
for (const t of cases) {
  console.log('--- ' + t);
  console.log('  BORDER_EN=' + JSON.stringify(I.BORDER_EN.map(r => { const m = t.match(r); return m ? m[0] : null; }).filter(Boolean)));
  console.log('  CLAIM_EN=' + JSON.stringify(I.CLAIM_EN.map(r => { const m = t.match(r); return m ? m[0] : null; }).filter(Boolean)));
  console.log('  NONSIG_EN=' + JSON.stringify(I.NONSIG_EN.map(r => { const m = t.match(r); return m ? m[0] : null; }).filter(Boolean)));
  console.log('  PVALUE_EN=' + JSON.stringify(I.PVALUE_EN.map(r => { const m = t.match(r); return m ? m[0] : null; }).filter(Boolean)));
  console.log('  NOEFFECT_EN=' + JSON.stringify(I.NOEFFECT_EN.map(r => { const m = t.match(r); return m ? m[0] : null; }).filter(Boolean)));
  console.log('  INFER_EN=' + JSON.stringify((t.match(new RegExp(I.INFER_EN.source, 'gi')) || [])));
  console.log('  CONCEPT_EN=' + I.CONCEPT_EN.test(t) + ' CORRECT_EN=' + I.CORRECT_EN.test(t));
  console.log('  CONCEPT_ZH=' + I.CONCEPT_ZH.test(t) + ' CORRECT_ZH=' + I.CORRECT_ZH.test(t));
  console.log('  BORDER_ZH=' + JSON.stringify(I.BORDER_ZH.map(r => { const m = t.match(r); return m ? m[0] : null; }).filter(Boolean)));
  console.log('  CLAIM_ZH=' + JSON.stringify(I.CLAIM_ZH.map(r => { const m = t.match(r); return m ? m[0] : null; }).filter(Boolean)));
  console.log('  NONSIG_ZH=' + JSON.stringify(I.NONSIG_ZH.map(r => { const m = t.match(r); return m ? m[0] : null; }).filter(Boolean)));
  console.log('  NOEFFECT_ZH=' + JSON.stringify(I.NOEFFECT_ZH.map(r => { const m = t.match(r); return m ? m[0] : null; }).filter(Boolean)));
  console.log('  INFER_ZH=' + JSON.stringify((t.match(new RegExp(I.INFER_ZH.source, 'g')) || [])));
  console.log('  sigs=' + JSON.stringify(I.findSignatures(t).map(s => s.sub + '|' + s.leg1 + '|' + s.leg2 + '|' + s.infer)));
  console.log('  result=' + JSON.stringify(detectSignificanceVerdictMisread(t).hit));
}
